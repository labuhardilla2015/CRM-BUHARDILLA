import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RegistroTiempo, Rol } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarRegistroDto,
  CrearRegistroDto,
  RegistrosQueryDto,
  StartRegistroDto,
} from './dto/registro-tiempo.dto';

const incluirCliente = {
  cliente: { select: { id: true, nombre: true } },
} satisfies Prisma.RegistroTiempoInclude;

@Injectable()
export class RegistrosService {
  constructor(private prisma: PrismaService) {}

  /** Registro en marcha (sin fin) del usuario, si existe. */
  corriendo(usuarioId: string) {
    return this.prisma.registroTiempo.findFirst({
      where: { usuarioId, fin: null },
      orderBy: { inicio: 'desc' },
      include: incluirCliente,
    });
  }

  /**
   * Arranca el cronómetro. Estilo Toggl: si ya hay uno en marcha, lo detiene
   * automáticamente antes de empezar el nuevo.
   */
  async start(usuarioId: string, dto: StartRegistroDto): Promise<RegistroTiempo> {
    await this.detenerEnMarcha(usuarioId);
    return this.prisma.registroTiempo.create({
      data: {
        usuarioId,
        clienteId: dto.clienteId,
        accion: dto.accion,
        descripcion: dto.descripcion,
        inicio: new Date(),
      },
      include: incluirCliente,
    });
  }

  /** Detiene el cronómetro en marcha del usuario. */
  async stop(usuarioId: string): Promise<RegistroTiempo> {
    const enMarcha = await this.prisma.registroTiempo.findFirst({
      where: { usuarioId, fin: null },
      orderBy: { inicio: 'desc' },
    });
    if (!enMarcha) throw new ConflictException('No tienes ningún cronómetro en marcha');
    return this.prisma.registroTiempo.update({
      where: { id: enMarcha.id },
      data: { fin: new Date() },
      include: incluirCliente,
    });
  }

  /** Crea un registro manual con inicio y fin (p. ej. desde el calendario). */
  crearManual(usuarioId: string, dto: CrearRegistroDto): Promise<RegistroTiempo> {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (fin <= inicio) {
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
    }
    return this.prisma.registroTiempo.create({
      data: {
        usuarioId,
        clienteId: dto.clienteId,
        accion: dto.accion,
        descripcion: dto.descripcion,
        inicio,
        fin,
      },
      include: incluirCliente,
    });
  }

  /** Listado por rango. Trabajador ve lo suyo; admin puede filtrar por usuario. */
  listar(solicitante: { id: string; rol: Rol }, query: RegistrosQueryDto) {
    const esAdmin = solicitante.rol === Rol.ADMIN;
    const usuarioId = esAdmin ? query.usuarioId : solicitante.id;

    return this.prisma.registroTiempo.findMany({
      where: {
        ...(usuarioId ? { usuarioId } : {}),
        ...(query.desde || query.hasta
          ? {
              inicio: {
                ...(query.desde ? { gte: new Date(query.desde) } : {}),
                ...(query.hasta ? { lte: new Date(query.hasta) } : {}),
              },
            }
          : {}),
      },
      orderBy: { inicio: 'asc' },
      include: {
        ...incluirCliente,
        ...(esAdmin ? { usuario: { select: { id: true, nombre: true } } } : {}),
      },
      take: 500,
    });
  }

  /** Edita un registro. Solo su dueño o un admin. */
  async actualizar(
    id: string,
    dto: ActualizarRegistroDto,
    solicitante: { id: string; rol: Rol },
  ): Promise<RegistroTiempo> {
    const reg = await this.exigirAcceso(id, solicitante);

    const inicio = dto.inicio ? new Date(dto.inicio) : reg.inicio;
    const fin = dto.fin ? new Date(dto.fin) : reg.fin;
    if (fin && fin <= inicio) {
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
    }

    return this.prisma.registroTiempo.update({
      where: { id },
      data: {
        clienteId: dto.clienteId ?? reg.clienteId,
        accion: dto.accion ?? reg.accion,
        descripcion: dto.descripcion ?? reg.descripcion,
        inicio,
        fin,
      },
      include: incluirCliente,
    });
  }

  /** Elimina un registro. Solo su dueño o un admin. */
  async eliminar(id: string, solicitante: { id: string; rol: Rol }): Promise<void> {
    await this.exigirAcceso(id, solicitante);
    await this.prisma.registroTiempo.delete({ where: { id } });
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  private async detenerEnMarcha(usuarioId: string) {
    await this.prisma.registroTiempo.updateMany({
      where: { usuarioId, fin: null },
      data: { fin: new Date() },
    });
  }

  private async exigirAcceso(id: string, solicitante: { id: string; rol: Rol }) {
    const reg = await this.prisma.registroTiempo.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Registro no encontrado');
    if (solicitante.rol !== Rol.ADMIN && reg.usuarioId !== solicitante.id) {
      throw new ForbiddenException('No puedes modificar registros de otros usuarios');
    }
    return reg;
  }
}

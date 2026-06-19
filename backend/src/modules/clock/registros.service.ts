import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccionTiempo, Prisma, RegistroTiempo, Rol, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ActualizarRegistroDto,
  CrearRegistroDto,
  RegistrosQueryDto,
  StartRegistroDto,
} from './dto/registro-tiempo.dto';

const incluirCliente = {
  cliente: { select: { id: true, nombre: true } },
} satisfies Prisma.RegistroTiempoInclude;

const ACCION_LABEL: Record<AccionTiempo, string> = {
  SEO: 'SEO', WEB: 'Web', RRSS: 'RRSS', DISENO: 'Diseño', INFORMES: 'Informes',
  SEO_LOCAL: 'SEO Local', ADS: 'Ads', ADMINISTRACION: 'Administración',
  ESTRATEGIA: 'Estrategia', EMAIL_MARKETING: 'Email Marketing',
};

@Injectable()
export class RegistrosService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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
    const reg = await this.prisma.registroTiempo.update({
      where: { id: enMarcha.id },
      data: { fin: new Date() },
      include: incluirCliente,
    });
    await this.avisarSiExcede(reg);
    return reg;
  }

  /** Crea un registro manual con inicio y fin (p. ej. desde el calendario). */
  async crearManual(usuarioId: string, dto: CrearRegistroDto): Promise<RegistroTiempo> {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (fin <= inicio) {
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
    }
    const reg = await this.prisma.registroTiempo.create({
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
    await this.avisarSiExcede(reg);
    return reg;
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

  /**
   * Avisa a los admins si este registro hace que el cliente supere el límite
   * mensual de la acción (solo cuando se cruza el límite, para no repetir).
   */
  private async avisarSiExcede(reg: { clienteId: string; accion: AccionTiempo; inicio: Date; fin: Date | null }) {
    if (!reg.fin) return;
    const limite = await this.prisma.limiteCliente.findUnique({
      where: { clienteId_accion: { clienteId: reg.clienteId, accion: reg.accion } },
    });
    if (!limite) return;

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    const registros = await this.prisma.registroTiempo.findMany({
      where: { clienteId: reg.clienteId, accion: reg.accion, fin: { not: null }, inicio: { gte: inicioMes, lt: finMes } },
      select: { inicio: true, fin: true },
    });

    const totalSeg = registros.reduce((a, r) => a + (r.fin!.getTime() - r.inicio.getTime()) / 1000, 0);
    const horasAhora = totalSeg / 3600;
    const horasReg = (reg.fin.getTime() - reg.inicio.getTime()) / 1000 / 3600;
    const horasAntes = horasAhora - horasReg;

    if (horasAhora > limite.horas && horasAntes <= limite.horas) {
      const cliente = await this.prisma.cliente.findUnique({ where: { id: reg.clienteId }, select: { nombre: true } });
      const admins = await this.prisma.usuario.findMany({ where: { rol: Rol.ADMIN, activo: true }, select: { id: true } });
      const mensaje = `"${cliente?.nombre ?? 'Cliente'}" ha superado el límite mensual de ${ACCION_LABEL[reg.accion]} (${limite.horas}h)`;
      await Promise.all(
        admins.map((a) =>
          this.notifications.crear({
            usuarioId: a.id,
            tipo: TipoNotificacion.LIMITE_HORAS,
            mensaje,
            entidadTipo: 'cliente',
            entidadId: reg.clienteId,
          }),
        ),
      );
    }
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

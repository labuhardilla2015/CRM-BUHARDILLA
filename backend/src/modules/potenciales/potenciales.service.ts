import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoPotencial, Potencial, Rol, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActualizarPotencialDto, CrearPotencialDto } from './dto/potencial.dto';
import { LeadPublicoDto } from './dto/lead-publico.dto';

const incluirCliente = {
  cliente: { select: { id: true, nombre: true } },
};

@Injectable()
export class PotencialesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Crea un potencial a partir del formulario de la web y avisa a los admins. */
  async crearDesdeWeb(dto: LeadPublicoDto): Promise<{ ok: true }> {
    const notasPartes = [dto.telefono ? `Tel: ${dto.telefono}` : '', dto.mensaje ?? ''].filter(Boolean);
    const potencial = await this.prisma.potencial.create({
      data: {
        nombre: dto.nombre,
        contacto: dto.email ?? dto.telefono ?? null,
        origen: 'Web',
        notas: notasPartes.join('\n') || null,
        estado: EstadoPotencial.NUEVO,
      },
    });

    const admins = await this.prisma.usuario.findMany({
      where: { rol: Rol.ADMIN, activo: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        this.notifications.crear({
          usuarioId: a.id,
          tipo: TipoNotificacion.POTENCIAL,
          mensaje: `Nuevo potencial desde la web: "${dto.nombre}"`,
          entidadTipo: 'potencial',
          entidadId: potencial.id,
        }),
      ),
    );
    return { ok: true };
  }

  listar() {
    return this.prisma.potencial.findMany({
      orderBy: [{ estado: 'asc' }, { createdAt: 'desc' }],
      include: incluirCliente,
    });
  }

  crear(dto: CrearPotencialDto, createdById: string): Promise<Potencial> {
    return this.prisma.potencial.create({
      data: { ...dto, createdById },
    });
  }

  async detalle(id: string) {
    const p = await this.prisma.potencial.findUnique({ where: { id }, include: incluirCliente });
    if (!p) throw new NotFoundException('Potencial no encontrado');
    return p;
  }

  async actualizar(id: string, dto: ActualizarPotencialDto): Promise<Potencial> {
    await this.exigir(id);
    return this.prisma.potencial.update({ where: { id }, data: dto, include: incluirCliente });
  }

  async eliminar(id: string): Promise<void> {
    await this.exigir(id);
    await this.prisma.potencial.delete({ where: { id } });
  }

  /**
   * Convierte el potencial en cliente del módulo Clientes: crea el cliente con
   * sus datos, enlaza el potencial y lo marca como ACEPTADO.
   */
  async convertir(id: string) {
    const potencial = await this.exigir(id);
    if (potencial.clienteConvertidoId) {
      throw new ConflictException('Este potencial ya se convirtió en cliente');
    }
    const existe = await this.prisma.cliente.findUnique({ where: { nombre: potencial.nombre } });
    if (existe) {
      throw new ConflictException('Ya existe un cliente con ese nombre');
    }

    const cliente = await this.prisma.cliente.create({
      data: {
        nombre: potencial.nombre,
        email: potencial.contacto,
        contacto: potencial.contacto,
        notas: potencial.notas,
      },
      omit: { datosSensibles: true },
    });

    await this.prisma.potencial.update({
      where: { id },
      data: { clienteConvertidoId: cliente.id, estado: EstadoPotencial.ACEPTADO },
    });

    return cliente;
  }

  private async exigir(id: string): Promise<Potencial> {
    const p = await this.prisma.potencial.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Potencial no encontrado');
    return p;
  }
}

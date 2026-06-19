import { Injectable } from '@nestjs/common';
import { Notificacion, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

interface CrearNotificacion {
  usuarioId: string;
  tipo: TipoNotificacion;
  mensaje: string;
  entidadTipo?: string;
  entidadId?: string;
  fechaFin?: Date | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  /** Crea una notificación y la emite por WebSocket en tiempo real. */
  async crear(data: CrearNotificacion): Promise<Notificacion> {
    const notif = await this.prisma.notificacion.create({
      data: {
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        mensaje: data.mensaje,
        entidadTipo: data.entidadTipo,
        entidadId: data.entidadId,
        fechaFin: data.fechaFin ?? null,
      },
    });
    this.gateway.emitir(data.usuarioId, 'notificacion', notif);
    return notif;
  }

  listar(usuarioId: string): Promise<Notificacion[]> {
    return this.prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  contarNoLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({ where: { usuarioId, leida: false } });
  }

  async marcarLeida(id: string, usuarioId: string): Promise<void> {
    await this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    });
  }

  async marcarTodas(usuarioId: string): Promise<void> {
    await this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
  }

  /** Atajo: notifica la asignación de una tarjeta (con su fecha de fin). */
  notificarAsignacion(usuarioId: string, tarjetaId: string, titulo: string, fechaFin: Date | null) {
    return this.crear({
      usuarioId,
      tipo: TipoNotificacion.TARJETA_ASIGNADA,
      mensaje: `Se te ha asignado la tarjeta "${titulo}"`,
      entidadTipo: 'tarjeta',
      entidadId: tarjetaId,
      fechaFin,
    });
  }
}

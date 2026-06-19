import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EstadoTarjeta, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface TarjetaVenc {
  id: string;
  titulo: string;
  fechaFin: Date | null;
  asignaciones: { usuarioId: string }[];
}

@Injectable()
export class VencimientosService {
  private readonly logger = new Logger(VencimientosService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Cada día a las 8:00 revisa los vencimientos de tarjetas. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async procesarDiario() {
    await this.procesar();
  }

  /**
   * Avisa a los asignados: 2 días antes de la fecha de fin y el día de
   * vencimiento. Cada aviso se envía una sola vez (flags en la tarjeta).
   */
  async procesar(): Promise<{ avisos: number }> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const tarjetas = (await this.prisma.tarjeta.findMany({
      where: {
        estado: { not: EstadoTarjeta.HECHO },
        fechaFin: { not: null },
        asignaciones: { some: {} },
      },
      select: {
        id: true,
        titulo: true,
        fechaFin: true,
        avisoPrevio: true,
        avisoVencimiento: true,
        asignaciones: { select: { usuarioId: true } },
      },
    })) as (TarjetaVenc & { avisoPrevio: boolean; avisoVencimiento: boolean })[];

    let avisos = 0;
    for (const t of tarjetas) {
      const fin = new Date(t.fechaFin!);
      fin.setHours(0, 0, 0, 0);
      const dias = Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);

      if (dias === 2 && !t.avisoPrevio) {
        await this.avisar(t, 'Faltan 2 días para la entrega de');
        await this.prisma.tarjeta.update({ where: { id: t.id }, data: { avisoPrevio: true } });
        avisos++;
      }
      if (dias === 0 && !t.avisoVencimiento) {
        await this.avisar(t, 'Hoy vence');
        await this.prisma.tarjeta.update({ where: { id: t.id }, data: { avisoVencimiento: true } });
        avisos++;
      }
    }

    this.logger.log(`Vencimientos procesados: ${avisos} aviso(s)`);
    return { avisos };
  }

  private avisar(t: TarjetaVenc, prefijo: string) {
    return Promise.all(
      t.asignaciones.map((a) =>
        this.notifications.crear({
          usuarioId: a.usuarioId,
          tipo: TipoNotificacion.VENCIMIENTO_TAREA,
          mensaje: `${prefijo} la tarjeta "${t.titulo}"`,
          entidadTipo: 'tarjeta',
          entidadId: t.id,
          fechaFin: t.fechaFin,
        }),
      ),
    );
  }
}

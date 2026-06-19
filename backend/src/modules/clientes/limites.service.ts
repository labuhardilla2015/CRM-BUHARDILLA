import { Injectable } from '@nestjs/common';
import { AccionTiempo } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface LimiteUso {
  accion: AccionTiempo;
  horas: number;
  horasUsadas: number;
  excedido: boolean;
}

/** Rango [inicio, fin) del mes actual. */
export function mesActual(): { inicio: Date; fin: Date } {
  const ahora = new Date();
  return {
    inicio: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
    fin: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1),
  };
}

@Injectable()
export class LimitesService {
  constructor(private prisma: PrismaService) {}

  /** Límites configurados del cliente con el uso del mes en curso. */
  async listarConUso(clienteId: string): Promise<LimiteUso[]> {
    const limites = await this.prisma.limiteCliente.findMany({
      where: { clienteId },
      orderBy: { accion: 'asc' },
    });
    if (limites.length === 0) return [];

    const { inicio, fin } = mesActual();
    const registros = await this.prisma.registroTiempo.findMany({
      where: { clienteId, fin: { not: null }, inicio: { gte: inicio, lt: fin } },
      select: { accion: true, inicio: true, fin: true },
    });

    const usoSeg = new Map<AccionTiempo, number>();
    for (const r of registros) {
      const seg = (r.fin!.getTime() - r.inicio.getTime()) / 1000;
      usoSeg.set(r.accion, (usoSeg.get(r.accion) ?? 0) + seg);
    }

    return limites.map((l) => {
      const horasUsadas = Math.round(((usoSeg.get(l.accion) ?? 0) / 3600) * 100) / 100;
      return { accion: l.accion, horas: l.horas, horasUsadas, excedido: horasUsadas > l.horas };
    });
  }

  /** Fija (o elimina si horas = 0) el límite de una acción para el cliente. */
  async setLimite(clienteId: string, accion: AccionTiempo, horas: number) {
    if (horas <= 0) {
      await this.prisma.limiteCliente.deleteMany({ where: { clienteId, accion } });
      return { ok: true };
    }
    return this.prisma.limiteCliente.upsert({
      where: { clienteId_accion: { clienteId, accion } },
      update: { horas },
      create: { clienteId, accion, horas },
    });
  }

  async eliminar(clienteId: string, accion: AccionTiempo) {
    await this.prisma.limiteCliente.deleteMany({ where: { clienteId, accion } });
  }
}

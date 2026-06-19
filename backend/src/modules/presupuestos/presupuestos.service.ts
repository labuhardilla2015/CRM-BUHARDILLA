import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoPotencial, EstadoPresupuesto } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarPresupuestoDto, CrearPresupuestoDto } from './dto/presupuesto.dto';

@Injectable()
export class PresupuestosService {
  constructor(private prisma: PrismaService) {}

  listarDePotencial(potencialId: string) {
    return this.prisma.presupuesto.findMany({
      where: { potencialId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async crear(potencialId: string, dto: CrearPresupuestoDto) {
    const potencial = await this.prisma.potencial.findUnique({ where: { id: potencialId } });
    if (!potencial) throw new NotFoundException('Potencial no encontrado');
    return this.prisma.presupuesto.create({
      data: { potencialId, concepto: dto.concepto, detalle: dto.detalle, monto: dto.monto },
    });
  }

  async actualizar(id: string, dto: ActualizarPresupuestoDto) {
    const p = await this.exigir(id);
    if (p.estado === EstadoPresupuesto.ACEPTADO) {
      throw new BadRequestException('No se puede editar un presupuesto aceptado');
    }
    return this.prisma.presupuesto.update({ where: { id }, data: dto });
  }

  /** Marca el presupuesto como ENVIADO y genera un token de aceptación. */
  async enviar(id: string) {
    const p = await this.exigir(id);
    const token = p.tokenAceptacion ?? randomBytes(24).toString('hex');
    const actualizado = await this.prisma.presupuesto.update({
      where: { id },
      data: { estado: EstadoPresupuesto.ENVIADO, tokenAceptacion: token },
    });
    if (p.potencialId) {
      await this.prisma.potencial.update({
        where: { id: p.potencialId },
        data: { estado: EstadoPotencial.PRESUPUESTO_ENVIADO },
      });
    }
    return { id: actualizado.id, token, estado: actualizado.estado };
  }

  async eliminar(id: string) {
    await this.exigir(id);
    await this.prisma.presupuesto.delete({ where: { id } });
  }

  // ─── Público (por token, sin login) ────────────────────────────────
  async porToken(token: string) {
    const p = await this.prisma.presupuesto.findUnique({
      where: { tokenAceptacion: token },
      include: { potencial: { select: { nombre: true } } },
    });
    if (!p) throw new NotFoundException('Presupuesto no encontrado');
    return {
      concepto: p.concepto,
      detalle: p.detalle,
      monto: p.monto,
      estado: p.estado,
      aceptadoAt: p.aceptadoAt,
      destinatario: p.potencial?.nombre ?? null,
    };
  }

  async aceptar(token: string) {
    return this.resolverPublico(token, true);
  }

  async rechazar(token: string) {
    return this.resolverPublico(token, false);
  }

  private async resolverPublico(token: string, aceptar: boolean) {
    const p = await this.prisma.presupuesto.findUnique({ where: { tokenAceptacion: token } });
    if (!p) throw new NotFoundException('Presupuesto no encontrado');

    // Idempotente si ya está en el estado destino
    if (aceptar && p.estado === EstadoPresupuesto.ACEPTADO) return { ok: true, estado: p.estado };
    if (!aceptar && p.estado === EstadoPresupuesto.RECHAZADO) return { ok: true, estado: p.estado };

    if (p.estado !== EstadoPresupuesto.ENVIADO) {
      throw new BadRequestException('Este presupuesto ya no admite respuesta');
    }

    const nuevoEstado = aceptar ? EstadoPresupuesto.ACEPTADO : EstadoPresupuesto.RECHAZADO;
    await this.prisma.presupuesto.update({
      where: { id: p.id },
      data: { estado: nuevoEstado, aceptadoAt: aceptar ? new Date() : null },
    });

    if (p.potencialId) {
      await this.prisma.potencial.update({
        where: { id: p.potencialId },
        data: { estado: aceptar ? EstadoPotencial.ACEPTADO : EstadoPotencial.RECHAZADO },
      });
    }
    return { ok: true, estado: nuevoEstado };
  }

  private async exigir(id: string) {
    const p = await this.prisma.presupuesto.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Presupuesto no encontrado');
    return p;
  }
}

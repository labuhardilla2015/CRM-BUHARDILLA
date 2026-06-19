import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoTarjeta, Prisma, Tarjeta, TipoTablero } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarTarjetaDto,
  CrearTarjetaDto,
} from './dto/tarjeta.dto';

const incluirTablero = {
  tablero: { select: { tipo: true, clienteId: true } },
} satisfies Prisma.TarjetaInclude;

/** Include para listados: añade asignados y contadores para las tarjetas. */
const incluirResumenTarjeta = {
  tablero: { select: { tipo: true, clienteId: true } },
  asignaciones: { include: { usuario: { select: { id: true, nombre: true } } } },
  _count: { select: { comentarios: true, archivos: true, checklistItems: true } },
} satisfies Prisma.TarjetaInclude;

@Injectable()
export class TablerosService {
  constructor(private prisma: PrismaService) {}

  /** Resumen de tableros del cliente que tienen alguna tarea activa (no HECHO). */
  async resumen(clienteId: string) {
    const tableros = await this.prisma.tablero.findMany({
      where: { clienteId },
      include: { tarjetas: { select: { estado: true } } },
      orderBy: { tipo: 'asc' },
    });

    return tableros
      .map((t) => {
        const total = t.tarjetas.length;
        const activas = t.tarjetas.filter((x) => x.estado !== EstadoTarjeta.HECHO).length;
        return { id: t.id, tipo: t.tipo, total, activas };
      })
      .filter((t) => t.activas > 0);
  }

  /** Tarjetas de un cliente, opcionalmente filtradas por tipo de tablero. */
  listarTarjetas(
    clienteId: string,
    opts: { tipo?: TipoTablero; asignadoId?: string; activas?: boolean } = {},
  ) {
    return this.prisma.tarjeta.findMany({
      where: {
        tablero: { clienteId, ...(opts.tipo ? { tipo: opts.tipo } : {}) },
        ...(opts.activas ? { estado: { not: EstadoTarjeta.HECHO } } : {}),
        ...(opts.asignadoId
          ? { asignaciones: { some: { usuarioId: opts.asignadoId } } }
          : {}),
      },
      include: incluirResumenTarjeta,
      orderBy: [{ estado: 'asc' }, { orden: 'asc' }],
    });
  }

  /** Crea una tarjeta, creando el tablero (cliente+tipo) si no existe. */
  async crearTarjeta(clienteId: string, dto: CrearTarjetaDto): Promise<Tarjeta> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    this.validarFechas(dto.fechaInicio, dto.fechaFin);

    const tablero = await this.prisma.tablero.upsert({
      where: { clienteId_tipo: { clienteId, tipo: dto.tipo } },
      update: {},
      create: { clienteId, tipo: dto.tipo },
    });

    const estado = dto.estado ?? EstadoTarjeta.PENDIENTE;
    const orden = await this.prisma.tarjeta.count({
      where: { tableroId: tablero.id, estado },
    });

    return this.prisma.tarjeta.create({
      data: {
        tableroId: tablero.id,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        estado,
        orden,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      },
      include: incluirTablero,
    });
  }

  /** Actualiza una tarjeta (incluye mover de columna: estado + orden). */
  async actualizarTarjeta(id: string, dto: ActualizarTarjetaDto): Promise<Tarjeta> {
    const tarjeta = await this.prisma.tarjeta.findUnique({ where: { id } });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');

    const fechaInicio = dto.fechaInicio !== undefined ? toDate(dto.fechaInicio) : tarjeta.fechaInicio;
    const fechaFin = dto.fechaFin !== undefined ? toDate(dto.fechaFin) : tarjeta.fechaFin;
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }

    return this.prisma.tarjeta.update({
      where: { id },
      data: {
        titulo: dto.titulo ?? tarjeta.titulo,
        descripcion: dto.descripcion ?? tarjeta.descripcion,
        estado: dto.estado ?? tarjeta.estado,
        progreso: dto.progreso ?? tarjeta.progreso,
        orden: dto.orden ?? tarjeta.orden,
        fechaInicio,
        fechaFin,
      },
      include: incluirTablero,
    });
  }

  async eliminarTarjeta(id: string): Promise<void> {
    const tarjeta = await this.prisma.tarjeta.findUnique({ where: { id } });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');
    await this.prisma.tarjeta.delete({ where: { id } });
  }

  private validarFechas(inicio?: string, fin?: string) {
    if (inicio && fin && new Date(fin) < new Date(inicio)) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }
  }
}

function toDate(v?: string | null): Date | null {
  return v ? new Date(v) : null;
}

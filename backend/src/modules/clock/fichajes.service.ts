import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Fichaje, Rol } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EditarFichajeDto } from './dto/editar-fichaje.dto';
import { HistorialQueryDto } from './dto/historial-query.dto';

@Injectable()
export class FichajesService {
  constructor(private prisma: PrismaService) {}

  /** Fichaje abierto (sin fin) del usuario, si existe. */
  estadoActual(usuarioId: string): Promise<Fichaje | null> {
    return this.prisma.fichaje.findFirst({
      where: { usuarioId, fin: null },
      orderBy: { inicio: 'desc' },
    });
  }

  /** Marca de entrada. Falla si ya hay una jornada abierta. */
  async entrada(usuarioId: string): Promise<Fichaje> {
    const abierto = await this.estadoActual(usuarioId);
    if (abierto) {
      throw new ConflictException('Ya tienes una jornada abierta');
    }
    return this.prisma.fichaje.create({
      data: { usuarioId, inicio: new Date() },
    });
  }

  /** Marca de salida. Falla si no hay jornada abierta. */
  async salida(usuarioId: string): Promise<Fichaje> {
    const abierto = await this.estadoActual(usuarioId);
    if (!abierto) {
      throw new ConflictException('No tienes ninguna jornada abierta');
    }
    return this.prisma.fichaje.update({
      where: { id: abierto.id },
      data: { fin: new Date() },
    });
  }

  /**
   * Historial de fichajes. Un TRABAJADOR solo ve los suyos; un ADMIN puede
   * filtrar por `usuarioId` (o ver todos si no lo indica).
   */
  historial(
    solicitante: { id: string; rol: Rol },
    query: HistorialQueryDto,
  ): Promise<Fichaje[]> {
    const esAdmin = solicitante.rol === Rol.ADMIN;
    const usuarioId = esAdmin ? query.usuarioId : solicitante.id;

    return this.prisma.fichaje.findMany({
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
      orderBy: { inicio: 'desc' },
      include: esAdmin
        ? { usuario: { select: { id: true, nombre: true } } }
        : undefined,
      take: 200,
    });
  }

  /** Edición de marcas (solo ADMIN). Registra quién y cuándo edita. */
  async editar(
    fichajeId: string,
    dto: EditarFichajeDto,
    adminId: string,
  ): Promise<Fichaje> {
    const fichaje = await this.prisma.fichaje.findUnique({ where: { id: fichajeId } });
    if (!fichaje) throw new NotFoundException('Fichaje no encontrado');

    const inicio = dto.inicio ? new Date(dto.inicio) : fichaje.inicio;
    const fin = dto.fin ? new Date(dto.fin) : fichaje.fin;

    if (fin && fin <= inicio) {
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
    }

    return this.prisma.fichaje.update({
      where: { id: fichajeId },
      data: {
        inicio,
        fin,
        editadoPorId: adminId,
        editadoAt: new Date(),
      },
    });
  }
}

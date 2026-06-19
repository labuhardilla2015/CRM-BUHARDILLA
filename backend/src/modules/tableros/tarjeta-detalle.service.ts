import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

const autorSelect = { select: { id: true, nombre: true } };

@Injectable()
export class TarjetaDetalleService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /** Detalle completo de la tarjeta para el modal. */
  async detalle(tarjetaId: string) {
    const tarjeta = await this.prisma.tarjeta.findUnique({
      where: { id: tarjetaId },
      include: {
        comentarios: { include: { usuario: autorSelect }, orderBy: { createdAt: 'asc' } },
        checklistItems: { orderBy: { orden: 'asc' } },
        archivos: { include: { usuario: autorSelect }, orderBy: { createdAt: 'desc' } },
        asignaciones: { include: { usuario: autorSelect } },
      },
    });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada');
    return tarjeta;
  }

  // ─── Comentarios ───────────────────────────────────────────────────
  async crearComentario(tarjetaId: string, usuarioId: string, texto: string) {
    await this.exigirTarjeta(tarjetaId);
    return this.prisma.comentario.create({
      data: { tarjetaId, usuarioId, texto },
      include: { usuario: autorSelect },
    });
  }

  async eliminarComentario(id: string, solicitante: { id: string; rol: Rol }) {
    const c = await this.prisma.comentario.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Comentario no encontrado');
    if (solicitante.rol !== Rol.ADMIN && c.usuarioId !== solicitante.id) {
      throw new ForbiddenException('No puedes borrar comentarios de otros');
    }
    await this.prisma.comentario.delete({ where: { id } });
  }

  // ─── Checklist ─────────────────────────────────────────────────────
  async crearChecklistItem(tarjetaId: string, texto: string) {
    await this.exigirTarjeta(tarjetaId);
    const orden = await this.prisma.checklistItem.count({ where: { tarjetaId } });
    return this.prisma.checklistItem.create({ data: { tarjetaId, texto, orden } });
  }

  async actualizarChecklistItem(id: string, data: { texto?: string; completado?: boolean }) {
    await this.exigirChecklist(id);
    return this.prisma.checklistItem.update({ where: { id }, data });
  }

  async eliminarChecklistItem(id: string) {
    await this.exigirChecklist(id);
    await this.prisma.checklistItem.delete({ where: { id } });
  }

  // ─── Asignaciones ──────────────────────────────────────────────────
  async setAsignados(tarjetaId: string, usuarioIds: string[]) {
    await this.exigirTarjeta(tarjetaId);
    // Reemplaza el conjunto completo de asignados
    await this.prisma.$transaction([
      this.prisma.asignacionTarjeta.deleteMany({ where: { tarjetaId } }),
      this.prisma.asignacionTarjeta.createMany({
        data: usuarioIds.map((usuarioId) => ({ tarjetaId, usuarioId })),
        skipDuplicates: true,
      }),
    ]);
    return this.prisma.asignacionTarjeta.findMany({
      where: { tarjetaId },
      include: { usuario: autorSelect },
    });
  }

  // ─── Archivos ──────────────────────────────────────────────────────
  async guardarArchivo(
    tarjetaId: string,
    usuarioId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    await this.exigirTarjeta(tarjetaId);
    const { ruta, tamano } = this.storage.save(file.buffer, file.originalname);
    return this.prisma.archivo.create({
      data: {
        tarjetaId,
        usuarioId,
        nombre: file.originalname.slice(0, 255),
        ruta,
        mime: file.mimetype.slice(0, 120),
        tamano,
      },
      include: { usuario: autorSelect },
    });
  }

  async archivoParaDescarga(id: string) {
    const a = await this.prisma.archivo.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Archivo no encontrado');
    return { absPath: this.storage.absolutePath(a.ruta), nombre: a.nombre, mime: a.mime };
  }

  async eliminarArchivo(id: string, solicitante: { id: string; rol: Rol }) {
    const a = await this.prisma.archivo.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Archivo no encontrado');
    if (solicitante.rol !== Rol.ADMIN && a.usuarioId !== solicitante.id) {
      throw new ForbiddenException('No puedes borrar archivos de otros');
    }
    await this.prisma.archivo.delete({ where: { id } });
    this.storage.remove(a.ruta);
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  private async exigirTarjeta(id: string) {
    const t = await this.prisma.tarjeta.findUnique({ where: { id }, select: { id: true } });
    if (!t) throw new NotFoundException('Tarjeta no encontrada');
  }

  private async exigirChecklist(id: string) {
    const t = await this.prisma.checklistItem.findUnique({ where: { id }, select: { id: true } });
    if (!t) throw new NotFoundException('Ítem de checklist no encontrado');
  }
}

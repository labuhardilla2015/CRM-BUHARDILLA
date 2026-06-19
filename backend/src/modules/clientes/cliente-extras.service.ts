import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { CrearEnlaceDto } from './dto/extras.dto';

@Injectable()
export class ClienteExtrasService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // ─── Documentos ────────────────────────────────────────────────────
  listarDocumentos(clienteId: string) {
    return this.prisma.documentoCliente.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async subirDocumento(
    clienteId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    await this.exigirCliente(clienteId);
    const { ruta, tamano } = this.storage.save(file.buffer, file.originalname);
    return this.prisma.documentoCliente.create({
      data: {
        clienteId,
        nombre: file.originalname.slice(0, 255),
        ruta,
        mime: file.mimetype.slice(0, 120),
        tamano,
      },
    });
  }

  async documentoParaDescarga(docId: string) {
    const d = await this.prisma.documentoCliente.findUnique({ where: { id: docId } });
    if (!d) throw new NotFoundException('Documento no encontrado');
    return { absPath: this.storage.absolutePath(d.ruta), nombre: d.nombre };
  }

  async eliminarDocumento(docId: string) {
    const d = await this.prisma.documentoCliente.findUnique({ where: { id: docId } });
    if (!d) throw new NotFoundException('Documento no encontrado');
    await this.prisma.documentoCliente.delete({ where: { id: docId } });
    this.storage.remove(d.ruta);
  }

  // ─── Enlaces / redes sociales ──────────────────────────────────────
  listarEnlaces(clienteId: string) {
    return this.prisma.enlaceCliente.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async crearEnlace(clienteId: string, dto: CrearEnlaceDto) {
    await this.exigirCliente(clienteId);
    return this.prisma.enlaceCliente.create({ data: { clienteId, ...dto } });
  }

  async eliminarEnlace(enlaceId: string) {
    const e = await this.prisma.enlaceCliente.findUnique({ where: { id: enlaceId } });
    if (!e) throw new NotFoundException('Enlace no encontrado');
    await this.prisma.enlaceCliente.delete({ where: { id: enlaceId } });
  }

  // ─── Logo del cliente ──────────────────────────────────────────────
  async subirLogo(clienteId: string, file: { buffer: Buffer; originalname: string }) {
    const c = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { logoRuta: true } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
    if (c.logoRuta) this.storage.remove(c.logoRuta);
    const { ruta } = this.storage.save(file.buffer, file.originalname);
    await this.prisma.cliente.update({ where: { id: clienteId }, data: { logoRuta: ruta } });
    return { ok: true };
  }

  async logoParaServir(clienteId: string) {
    const c = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { logoRuta: true } });
    if (!c?.logoRuta) throw new NotFoundException('Este cliente no tiene logo');
    return { absPath: this.storage.absolutePath(c.logoRuta) };
  }

  private async exigirCliente(id: string) {
    const c = await this.prisma.cliente.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }
}

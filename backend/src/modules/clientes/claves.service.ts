import { Injectable, NotFoundException } from '@nestjs/common';
import { SeccionClave } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { ActualizarClaveDto, CrearClaveDto } from './dto/clave.dto';

export interface ClaveVista {
  id: string;
  seccion: SeccionClave;
  etiqueta: string;
  url: string | null;
  usuario: string | null;
  secreto: string | null;
  notas: string | null;
  orden: number;
}

@Injectable()
export class ClavesService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  /** Lista las claves del cliente con los campos sensibles descifrados. */
  async listar(clienteId: string): Promise<ClaveVista[]> {
    const claves = await this.prisma.claveCliente.findMany({
      where: { clienteId },
      orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
    });
    return claves.map((c) => ({
      id: c.id,
      seccion: c.seccion,
      etiqueta: c.etiqueta,
      url: c.url,
      usuario: this.crypto.decrypt(c.usuario),
      secreto: this.crypto.decrypt(c.secreto),
      notas: this.crypto.decrypt(c.notas),
      orden: c.orden,
    }));
  }

  async crear(clienteId: string, dto: CrearClaveDto): Promise<ClaveVista> {
    const orden = await this.prisma.claveCliente.count({
      where: { clienteId, seccion: dto.seccion },
    });
    const c = await this.prisma.claveCliente.create({
      data: {
        clienteId,
        seccion: dto.seccion,
        etiqueta: dto.etiqueta,
        url: dto.url ?? null,
        usuario: this.crypto.encrypt(dto.usuario ?? null),
        secreto: this.crypto.encrypt(dto.secreto ?? null),
        notas: this.crypto.encrypt(dto.notas ?? null),
        orden,
      },
    });
    return this.aVista(c);
  }

  async actualizar(clienteId: string, claveId: string, dto: ActualizarClaveDto): Promise<ClaveVista> {
    await this.exigir(clienteId, claveId);
    const c = await this.prisma.claveCliente.update({
      where: { id: claveId },
      data: {
        ...(dto.etiqueta !== undefined ? { etiqueta: dto.etiqueta } : {}),
        ...(dto.url !== undefined ? { url: dto.url || null } : {}),
        ...(dto.usuario !== undefined ? { usuario: this.crypto.encrypt(dto.usuario || null) } : {}),
        ...(dto.secreto !== undefined ? { secreto: this.crypto.encrypt(dto.secreto || null) } : {}),
        ...(dto.notas !== undefined ? { notas: this.crypto.encrypt(dto.notas || null) } : {}),
      },
    });
    return this.aVista(c);
  }

  async eliminar(clienteId: string, claveId: string): Promise<void> {
    await this.exigir(clienteId, claveId);
    await this.prisma.claveCliente.delete({ where: { id: claveId } });
  }

  private aVista(c: {
    id: string;
    seccion: SeccionClave;
    etiqueta: string;
    url: string | null;
    usuario: string | null;
    secreto: string | null;
    notas: string | null;
    orden: number;
  }): ClaveVista {
    return {
      id: c.id,
      seccion: c.seccion,
      etiqueta: c.etiqueta,
      url: c.url,
      usuario: this.crypto.decrypt(c.usuario),
      secreto: this.crypto.decrypt(c.secreto),
      notas: this.crypto.decrypt(c.notas),
      orden: c.orden,
    };
  }

  private async exigir(clienteId: string, claveId: string) {
    const c = await this.prisma.claveCliente.findUnique({ where: { id: claveId } });
    if (!c || c.clienteId !== clienteId) throw new NotFoundException('Clave no encontrada');
    return c;
  }
}

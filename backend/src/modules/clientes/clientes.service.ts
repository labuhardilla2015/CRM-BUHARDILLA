import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Cliente } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { ActualizarClienteDto } from './dto/cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';

/** Vista pública del cliente (sin datos sensibles cifrados). */
export type ClientePublico = Omit<Cliente, 'datosSensibles'>;

@Injectable()
export class ClientesService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  listar(soloActivos = true): Promise<ClientePublico[]> {
    return this.prisma.cliente.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
      omit: { datosSensibles: true },
    });
  }

  async crear(dto: CrearClienteDto): Promise<ClientePublico> {
    const existe = await this.prisma.cliente.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new ConflictException('Ya existe un cliente con ese nombre');
    return this.prisma.cliente.create({
      data: { nombre: dto.nombre },
      omit: { datosSensibles: true },
    });
  }

  async detalle(id: string): Promise<ClientePublico> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      omit: { datosSensibles: true },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async actualizar(id: string, dto: ActualizarClienteDto): Promise<ClientePublico> {
    await this.exigir(id);
    return this.prisma.cliente.update({
      where: { id },
      data: dto,
      omit: { datosSensibles: true },
    });
  }

  // ─── Datos sensibles (cifrados, solo desde Control) ─────────────────
  async getDatosSensibles(id: string): Promise<string | null> {
    const cliente = await this.exigir(id);
    return this.crypto.decrypt(cliente.datosSensibles);
  }

  async setDatosSensibles(id: string, texto: string | null | undefined): Promise<void> {
    await this.exigir(id);
    await this.prisma.cliente.update({
      where: { id },
      data: { datosSensibles: this.crypto.encrypt(texto ?? null) },
    });
  }

  private async exigir(id: string): Promise<Cliente> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }
}

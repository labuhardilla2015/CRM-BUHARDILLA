import { ConflictException, Injectable } from '@nestjs/common';
import { Cliente } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearClienteDto } from './dto/crear-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  listar(soloActivos = true): Promise<Cliente[]> {
    return this.prisma.cliente.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async crear(dto: CrearClienteDto): Promise<Cliente> {
    const existe = await this.prisma.cliente.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existe) throw new ConflictException('Ya existe un cliente con ese nombre');
    return this.prisma.cliente.create({ data: { nombre: dto.nombre } });
  }
}

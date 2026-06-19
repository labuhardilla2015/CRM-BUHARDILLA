import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { ActualizarTrabajadorDto, CrearTrabajadorDto } from './dto/trabajador.dto';

/** Campos públicos del trabajador (nunca el hash de la contraseña). */
const trabajadorSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  dni: true,
  telefono: true,
  puesto: true,
  enPracticas: true,
  contratoNombre: true,
  createdAt: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class TrabajadoresService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  listar() {
    return this.prisma.usuario.findMany({
      select: trabajadorSelect,
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
  }

  async detalle(id: string) {
    const u = await this.prisma.usuario.findUnique({ where: { id }, select: trabajadorSelect });
    if (!u) throw new NotFoundException('Trabajador no encontrado');
    return u;
  }

  /** Crea la cuenta de empleado con su rol y ficha. */
  async crear(dto: CrearTrabajadorDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existe) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email.toLowerCase(),
        passwordHash,
        rol: dto.rol,
        dni: dto.dni,
        telefono: dto.telefono,
        puesto: dto.puesto,
        enPracticas: dto.enPracticas ?? false,
      },
      select: trabajadorSelect,
    });
  }

  async actualizar(id: string, dto: ActualizarTrabajadorDto) {
    await this.exigir(id);
    const data: Prisma.UsuarioUpdateInput = {
      ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
      ...(dto.rol !== undefined ? { rol: dto.rol } : {}),
      ...(dto.dni !== undefined ? { dni: dto.dni } : {}),
      ...(dto.telefono !== undefined ? { telefono: dto.telefono } : {}),
      ...(dto.puesto !== undefined ? { puesto: dto.puesto } : {}),
      ...(dto.enPracticas !== undefined ? { enPracticas: dto.enPracticas } : {}),
      ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
    };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    return this.prisma.usuario.update({ where: { id }, data, select: trabajadorSelect });
  }

  async eliminar(id: string, solicitanteId: string) {
    if (id === solicitanteId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    const u = await this.exigir(id);
    if (u.contratoRuta) this.storage.remove(u.contratoRuta);
    await this.prisma.usuario.delete({ where: { id } });
  }

  // ─── Contrato (archivo) ────────────────────────────────────────────
  async subirContrato(
    id: string,
    file: { buffer: Buffer; originalname: string },
  ) {
    const u = await this.exigir(id);
    if (u.contratoRuta) this.storage.remove(u.contratoRuta);
    const { ruta } = this.storage.save(file.buffer, file.originalname);
    return this.prisma.usuario.update({
      where: { id },
      data: { contratoRuta: ruta, contratoNombre: file.originalname.slice(0, 255) },
      select: trabajadorSelect,
    });
  }

  async contratoParaDescarga(id: string) {
    const u = await this.exigir(id);
    if (!u.contratoRuta) throw new NotFoundException('Este trabajador no tiene contrato adjunto');
    return { absPath: this.storage.absolutePath(u.contratoRuta), nombre: u.contratoNombre ?? 'contrato' };
  }

  private async exigir(id: string) {
    const u = await this.prisma.usuario.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('Trabajador no encontrado');
    return u;
  }
}

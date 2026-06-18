import { Injectable } from '@nestjs/common';
import { Rol, Usuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  create(data: { nombre: string; email: string; passwordHash: string; rol: Rol }): Promise<Usuario> {
    return this.prisma.usuario.create({
      data: { ...data, email: data.email.toLowerCase() },
    });
  }

  /**
   * Determina el rol de un email consultando la tabla `role_emails`.
   * Coincide por email exacto o por dominio (patrón que empieza por "@").
   * Si no hay coincidencia, devuelve TRABAJADOR.
   */
  async resolveRolForEmail(email: string): Promise<Rol> {
    const normalized = email.toLowerCase();
    const dominio = '@' + normalized.split('@')[1];

    const match = await this.prisma.roleEmail.findFirst({
      where: {
        activo: true,
        patron: { in: [normalized, dominio] },
      },
    });

    return match?.rol ?? Rol.TRABAJADOR;
  }
}

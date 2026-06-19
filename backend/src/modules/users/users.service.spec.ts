import { Rol } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

function servicioCon(match: { rol: Rol } | null): UsersService {
  const prisma = {
    roleEmail: { findFirst: jest.fn().mockResolvedValue(match) },
  } as unknown as PrismaService;
  return new UsersService(prisma);
}

describe('UsersService.resolveRolForEmail', () => {
  it('asigna ADMIN cuando el email/dominio coincide en role_emails', async () => {
    const service = servicioCon({ rol: Rol.ADMIN });
    await expect(service.resolveRolForEmail('ana@labuhardilla.com')).resolves.toBe(Rol.ADMIN);
  });

  it('asigna TRABAJADOR cuando no hay coincidencia', async () => {
    const service = servicioCon(null);
    await expect(service.resolveRolForEmail('externo@gmail.com')).resolves.toBe(Rol.TRABAJADOR);
  });
});

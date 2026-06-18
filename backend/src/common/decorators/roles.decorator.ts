import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a uno o varios roles. Ej: @Roles(Rol.ADMIN) */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

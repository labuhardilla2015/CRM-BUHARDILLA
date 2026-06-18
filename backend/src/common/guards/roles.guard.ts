import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Comprueba el rol del usuario autenticado contra los roles requeridos
 * por @Roles(). Debe ejecutarse después del JwtAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !required.includes(user.rol)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}

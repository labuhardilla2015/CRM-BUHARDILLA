import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ControlService } from './control.service';

/**
 * Exige un token de Control válido (cabecera X-Control-Token) acotado al
 * cliente de la ruta (:id). Se usa junto a @Roles(ADMIN).
 */
@Injectable()
export class ControlGuard implements CanActivate {
  constructor(private control: ControlService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-control-token'] as string | undefined;
    const clienteId = req.params.id as string;
    await this.control.verificarToken(token, clienteId);
    return true;
  }
}

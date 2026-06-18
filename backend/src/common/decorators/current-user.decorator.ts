import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  id: string;
  email: string;
  rol: string;
}

/** Inyecta el usuario autenticado (payload del JWT) en el handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    return data ? user?.[data] : user;
  },
);

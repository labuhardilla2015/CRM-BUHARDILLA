import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';

export interface ControlTokenPayload {
  sub: string;
  clienteId: string;
  scope: 'control';
}

/**
 * Gestiona el acceso al apartado "Control" de un cliente. Verifica la
 * contraseña (CONTROL_PASSWORD, configurable) y emite un token de control de
 * corta duración acotado a ese cliente.
 */
@Injectable()
export class ControlService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  /** Comprueba la contraseña de Control (comparación en tiempo constante). */
  verificarPassword(password: string): boolean {
    const esperado = this.config.get<string>('CONTROL_PASSWORD', 'Buhardilla');
    const a = Buffer.from(password);
    const b = Buffer.from(esperado);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Emite un token de control acotado a un cliente (30 min). */
  async emitirToken(usuarioId: string, clienteId: string): Promise<string> {
    const payload: ControlTokenPayload = { sub: usuarioId, clienteId, scope: 'control' };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: '30m',
    });
  }

  /** Verifica un token de control y que corresponde al cliente indicado. */
  async verificarToken(token: string | undefined, clienteId: string): Promise<void> {
    if (!token) throw new UnauthorizedException('Falta el token de Control');
    try {
      const payload = await this.jwt.verifyAsync<ControlTokenPayload>(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });
      if (payload.scope !== 'control' || payload.clienteId !== clienteId) {
        throw new Error('scope/cliente inválido');
      }
    } catch {
      throw new UnauthorizedException('Token de Control inválido o caducado');
    }
  }
}

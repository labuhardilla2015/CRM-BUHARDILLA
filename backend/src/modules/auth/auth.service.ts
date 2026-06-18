import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── Registro ──────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const rol = await this.users.resolveRolForEmail(dto.email);

    const usuario = await this.users.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
      rol,
    });

    return this.issueTokens(usuario);
  }

  // ─── Login ─────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const usuario = await this.users.findByEmail(dto.email);
    // Comparación constante aunque no exista el usuario (evita enumeración)
    const hash = usuario?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await bcrypt.compare(dto.password, hash);

    if (!usuario || !ok || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.issueTokens(usuario);
  }

  // ─── Refresh (rotación) ────────────────────────────────────────────
  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException('Falta refresh token');

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });

    // Token desconocido, revocado o caducado → rechazar
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Rotación: revoca el actual y emite uno nuevo
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    if (!stored.usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    return this.issueTokens(stored.usuario);
  }

  // ─── Logout ────────────────────────────────────────────────────────
  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  /** Genera access (JWT) + refresh (opaco, hasheado en BD). */
  private async issueTokens(usuario: Usuario) {
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = randomBytes(REFRESH_BYTES).toString('hex');
    const expiresAt = this.refreshExpiry();
    await this.prisma.refreshToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    };
  }

  /** El refresh token se almacena hasheado (SHA-256), nunca en claro. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiry(): Date {
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const days = parseInt(raw, 10) || 7;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }
}

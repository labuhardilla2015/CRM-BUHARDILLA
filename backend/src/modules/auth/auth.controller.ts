import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private users: UsersService,
    private config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, refreshExpiresAt, ...rest } = await this.auth.register(dto);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return { accessToken: rest.accessToken, usuario: rest.usuario };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, refreshExpiresAt, ...rest } = await this.auth.login(dto);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return { accessToken: rest.accessToken, usuario: rest.usuario };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const current = req.cookies?.[REFRESH_COOKIE];
    const { refreshToken, refreshExpiresAt, ...rest } = await this.auth.refresh(current);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return { accessToken: rest.accessToken, usuario: rest.usuario };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return { ok: true };
  }

  /** Devuelve el usuario autenticado (protegido por el JwtAuthGuard global). */
  @Get('me')
  async me(@CurrentUser() user: JwtUser) {
    const u = await this.users.findById(user.id);
    if (!u) return null;
    return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo };
  }

  /** Cookie httpOnly: el refresh token nunca queda accesible a JS (anti-XSS). */
  private setRefreshCookie(res: Response, token: string, expires: Date) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/auth',
      expires,
    });
  }
}

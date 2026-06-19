import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Crea buzones de correo en cPanel (UAPI Email::add_pop) al dar de alta un
 * trabajador. Desactivado salvo que CPANEL_ENABLED=true. Es "best-effort": si
 * falla, NO bloquea la creación de la cuenta del CRM.
 *
 * Requiere en .env:
 *   CPANEL_ENABLED=true
 *   CPANEL_HOST=https://tu-servidor:2083
 *   CPANEL_USER=usuario_cpanel
 *   CPANEL_TOKEN=token_api_de_cpanel
 *   CPANEL_EMAIL_DOMAIN=labuhardilla.com
 *   CPANEL_EMAIL_QUOTA=0            # 0 = sin límite (MB en otro caso)
 */
@Injectable()
export class MailProvisioningService {
  private readonly logger = new Logger(MailProvisioningService.name);

  constructor(private config: ConfigService) {}

  get habilitado(): boolean {
    return this.config.get<string>('CPANEL_ENABLED') === 'true';
  }

  async crearBuzon(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.habilitado) return { ok: false, error: 'Provisión de email desactivada' };

    const host = this.config.get<string>('CPANEL_HOST');
    const user = this.config.get<string>('CPANEL_USER');
    const token = this.config.get<string>('CPANEL_TOKEN');
    const dominio = this.config.get<string>('CPANEL_EMAIL_DOMAIN');
    const quota = this.config.get<string>('CPANEL_EMAIL_QUOTA') ?? '0';
    if (!host || !user || !token || !dominio) {
      return { ok: false, error: 'Faltan variables de cPanel en la configuración' };
    }

    const [local, emailDom] = email.toLowerCase().split('@');
    if (emailDom !== dominio.toLowerCase()) {
      return { ok: false, error: `El dominio del email no coincide con ${dominio}` };
    }

    const params = new URLSearchParams({ email: local, domain: dominio, password, quota });
    const url = `${host.replace(/\/$/, '')}/execute/Email/add_pop?${params.toString()}`;

    try {
      const res = await fetch(url, { headers: { Authorization: `cpanel ${user}:${token}` } });
      const data: { status?: number; errors?: string[] } = await res.json();
      if (data?.status === 1) return { ok: true };
      return { ok: false, error: data?.errors?.join('; ') || 'cPanel rechazó la creación del buzón' };
    } catch (e) {
      this.logger.warn(`No se pudo crear el buzón ${email}: ${(e as Error).message}`);
      return { ok: false, error: 'No se pudo conectar con cPanel' };
    }
  }
}

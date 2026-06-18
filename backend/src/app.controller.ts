import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  /** Healthcheck público para comprobar que la API está viva. */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'crm-buhardilla-api' };
  }
}

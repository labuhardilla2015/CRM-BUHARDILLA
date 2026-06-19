import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('notificaciones')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  listar(@CurrentUser() user: JwtUser) {
    return this.notifications.listar(user.id);
  }

  @Get('no-leidas')
  async noLeidas(@CurrentUser() user: JwtUser) {
    return { total: await this.notifications.contarNoLeidas(user.id) };
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/leida')
  marcarLeida(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.notifications.marcarLeida(id, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('leer-todas')
  marcarTodas(@CurrentUser() user: JwtUser) {
    return this.notifications.marcarTodas(user.id);
  }
}

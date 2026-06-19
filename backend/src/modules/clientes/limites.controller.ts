import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { AccionTiempo, Rol } from '@prisma/client';
import { LimitesService } from './limites.service';
import { SetLimiteDto } from './dto/limite.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('clientes/:id/limites')
export class LimitesController {
  constructor(private limites: LimitesService) {}

  /** Límites + uso del mes (visible para cualquier empleado: avisos en crono). */
  @Get()
  listar(@Param('id', ParseUUIDPipe) id: string) {
    return this.limites.listarConUso(id);
  }

  /** Fija el límite de una acción (solo admin). horas = 0 lo elimina. */
  @Roles(Rol.ADMIN)
  @Put(':accion')
  set(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('accion', new ParseEnumPipe(AccionTiempo)) accion: AccionTiempo,
    @Body() dto: SetLimiteDto,
  ) {
    return this.limites.setLimite(id, accion, dto.horas);
  }

  @Roles(Rol.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':accion')
  eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('accion', new ParseEnumPipe(AccionTiempo)) accion: AccionTiempo,
  ) {
    return this.limites.eliminar(id, accion);
  }
}

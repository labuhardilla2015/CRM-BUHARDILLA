import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { FichajesService } from './fichajes.service';
import { EditarFichajeDto } from './dto/editar-fichaje.dto';
import { HistorialQueryDto } from './dto/historial-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('clock/fichajes')
export class FichajesController {
  constructor(private fichajes: FichajesService) {}

  /** Estado actual: jornada abierta del usuario (o null). */
  @Get('estado')
  estado(@CurrentUser() user: JwtUser) {
    return this.fichajes.estadoActual(user.id);
  }

  /** Marcar entrada de jornada. */
  @HttpCode(HttpStatus.CREATED)
  @Post('entrada')
  entrada(@CurrentUser() user: JwtUser) {
    return this.fichajes.entrada(user.id);
  }

  /** Marcar salida de jornada. */
  @HttpCode(HttpStatus.OK)
  @Post('salida')
  salida(@CurrentUser() user: JwtUser) {
    return this.fichajes.salida(user.id);
  }

  /** Historial (propio para trabajador; filtrable para admin). */
  @Get()
  historial(@CurrentUser() user: JwtUser, @Query() query: HistorialQueryDto) {
    return this.fichajes.historial({ id: user.id, rol: user.rol as Rol }, query);
  }

  /** Editar marcas de un fichaje (solo ADMIN). */
  @Roles(Rol.ADMIN)
  @Patch(':id')
  editar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditarFichajeDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.fichajes.editar(id, dto, user.id);
  }
}

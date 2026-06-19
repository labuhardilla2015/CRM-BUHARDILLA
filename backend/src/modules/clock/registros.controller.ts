import {
  Body,
  Controller,
  Delete,
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
import { RegistrosService } from './registros.service';
import {
  ActualizarRegistroDto,
  CrearRegistroDto,
  RegistrosQueryDto,
  StartRegistroDto,
} from './dto/registro-tiempo.dto';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('clock/registros')
export class RegistrosController {
  constructor(private registros: RegistrosService) {}

  /** Cronómetro en marcha del usuario (o null). */
  @Get('corriendo')
  corriendo(@CurrentUser() user: JwtUser) {
    return this.registros.corriendo(user.id);
  }

  /** Arranca el cronómetro (detiene cualquier otro en marcha). */
  @HttpCode(HttpStatus.CREATED)
  @Post('start')
  start(@CurrentUser() user: JwtUser, @Body() dto: StartRegistroDto) {
    return this.registros.start(user.id, dto);
  }

  /** Detiene el cronómetro en marcha. */
  @HttpCode(HttpStatus.OK)
  @Post('stop')
  stop(@CurrentUser() user: JwtUser) {
    return this.registros.stop(user.id);
  }

  /** Listado por rango (semana del calendario / informes). */
  @Get()
  listar(@CurrentUser() user: JwtUser, @Query() query: RegistrosQueryDto) {
    return this.registros.listar({ id: user.id, rol: user.rol as Rol }, query);
  }

  /** Crear registro manual con inicio y fin. */
  @HttpCode(HttpStatus.CREATED)
  @Post()
  crear(@CurrentUser() user: JwtUser, @Body() dto: CrearRegistroDto) {
    return this.registros.crearManual(user.id, dto);
  }

  /** Editar un registro (dueño o admin). */
  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarRegistroDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.registros.actualizar(id, dto, { id: user.id, rol: user.rol as Rol });
  }

  /** Eliminar un registro (dueño o admin). */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  eliminar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.registros.eliminar(id, { id: user.id, rol: user.rol as Rol });
  }
}

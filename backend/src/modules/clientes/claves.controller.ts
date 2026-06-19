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
} from '@nestjs/common';
import { ClavesService } from './claves.service';
import { ActualizarClaveDto, CrearClaveDto } from './dto/clave.dto';

/**
 * Hoja de claves del cliente. Accesible a cualquier empleado autenticado
 * (se usa a diario). Los secretos van cifrados en la base de datos.
 */
@Controller('clientes/:id/claves')
export class ClavesController {
  constructor(private claves: ClavesService) {}

  @Get()
  listar(@Param('id', ParseUUIDPipe) id: string) {
    return this.claves.listar(id);
  }

  @Post()
  crear(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearClaveDto) {
    return this.claves.crear(id, dto);
  }

  @Patch(':claveId')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claveId', ParseUUIDPipe) claveId: string,
    @Body() dto: ActualizarClaveDto,
  ) {
    return this.claves.actualizar(id, claveId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':claveId')
  eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claveId', ParseUUIDPipe) claveId: string,
  ) {
    return this.claves.eliminar(id, claveId);
  }
}

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
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { ClavesService } from './claves.service';
import { ControlGuard } from './control.guard';
import { ActualizarClaveDto, CrearClaveDto } from './dto/clave.dto';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Hoja de claves del cliente. Toda la ruta exige ser ADMIN y presentar un
 * token de Control válido (X-Control-Token) acotado al cliente (:id).
 */
@Roles(Rol.ADMIN)
@UseGuards(ControlGuard)
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

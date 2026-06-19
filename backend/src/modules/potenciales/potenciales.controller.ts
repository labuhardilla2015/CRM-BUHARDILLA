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
import { Rol } from '@prisma/client';
import { PotencialesService } from './potenciales.service';
import { ActualizarPotencialDto, CrearPotencialDto } from './dto/potencial.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

/** Embudo de potenciales. Toda la gestión es solo para administradores. */
@Roles(Rol.ADMIN)
@Controller('potenciales')
export class PotencialesController {
  constructor(private potenciales: PotencialesService) {}

  @Get()
  listar() {
    return this.potenciales.listar();
  }

  @Post()
  crear(@Body() dto: CrearPotencialDto, @CurrentUser() user: JwtUser) {
    return this.potenciales.crear(dto, user.id);
  }

  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.potenciales.detalle(id);
  }

  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarPotencialDto) {
    return this.potenciales.actualizar(id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.potenciales.eliminar(id);
  }

  /** Convierte el potencial en cliente. */
  @Post(':id/convertir')
  convertir(@Param('id', ParseUUIDPipe) id: string) {
    return this.potenciales.convertir(id);
  }
}

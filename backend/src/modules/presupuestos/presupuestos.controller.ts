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
import { PresupuestosService } from './presupuestos.service';
import { ActualizarPresupuestoDto, CrearPresupuestoDto } from './dto/presupuesto.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

/** Gestión de presupuestos (solo administradores). */
@Roles(Rol.ADMIN)
@Controller()
export class PresupuestosController {
  constructor(private presupuestos: PresupuestosService) {}

  @Get('potenciales/:id/presupuestos')
  listar(@Param('id', ParseUUIDPipe) id: string) {
    return this.presupuestos.listarDePotencial(id);
  }

  @Post('potenciales/:id/presupuestos')
  crear(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearPresupuestoDto) {
    return this.presupuestos.crear(id, dto);
  }

  @Patch('presupuestos/:id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarPresupuestoDto) {
    return this.presupuestos.actualizar(id, dto);
  }

  /** Envía el presupuesto: genera el token de aceptación público. */
  @Post('presupuestos/:id/enviar')
  enviar(@Param('id', ParseUUIDPipe) id: string) {
    return this.presupuestos.enviar(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('presupuestos/:id')
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.presupuestos.eliminar(id);
  }
}

/** Endpoints públicos de aceptación (sin login, por token). */
@Controller('publico/presupuestos')
export class PresupuestosPublicoController {
  constructor(private presupuestos: PresupuestosService) {}

  @Public()
  @Get(':token')
  ver(@Param('token') token: string) {
    return this.presupuestos.porToken(token);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(':token/aceptar')
  aceptar(@Param('token') token: string) {
    return this.presupuestos.aceptar(token);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(':token/rechazar')
  rechazar(@Param('token') token: string) {
    return this.presupuestos.rechazar(token);
  }
}

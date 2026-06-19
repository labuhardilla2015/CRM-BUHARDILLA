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
import { TablerosService } from './tableros.service';
import {
  ActualizarTarjetaDto,
  CrearTarjetaDto,
  TarjetasQueryDto,
} from './dto/tarjeta.dto';

@Controller()
export class TablerosController {
  constructor(private tableros: TablerosService) {}

  /** Tableros del cliente con tareas activas (panel de tableros). */
  @Get('clientes/:clienteId/tableros')
  resumen(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.tableros.resumen(clienteId);
  }

  /** Tarjetas del cliente (filtrable por tablero, trabajador y estado activo). */
  @Get('clientes/:clienteId/tarjetas')
  listar(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Query() query: TarjetasQueryDto,
  ) {
    return this.tableros.listarTarjetas(clienteId, query);
  }

  /** Crear una tarjeta (crea el tablero si no existía). */
  @HttpCode(HttpStatus.CREATED)
  @Post('clientes/:clienteId/tarjetas')
  crear(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Body() dto: CrearTarjetaDto,
  ) {
    return this.tableros.crearTarjeta(clienteId, dto);
  }

  /** Editar/mover una tarjeta. */
  @Patch('tarjetas/:id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarTarjetaDto) {
    return this.tableros.actualizarTarjeta(id, dto);
  }

  /** Eliminar una tarjeta. */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('tarjetas/:id')
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.tableros.eliminarTarjeta(id);
  }
}

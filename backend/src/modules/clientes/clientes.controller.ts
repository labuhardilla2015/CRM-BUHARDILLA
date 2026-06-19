import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CrearClienteDto } from './dto/crear-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private clientes: ClientesService) {}

  /** Lista de clientes activos (para el selector del cronómetro). */
  @Get()
  listar() {
    return this.clientes.listar();
  }

  /** Alta de un cliente seleccionable en el cronómetro. */
  @Post()
  crear(@Body() dto: CrearClienteDto) {
    return this.clientes.crear(dto);
  }
}

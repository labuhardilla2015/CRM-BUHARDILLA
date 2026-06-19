import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { ClientesService } from './clientes.service';
import { ControlService } from './control.service';
import { ControlGuard } from './control.guard';
import {
  ActualizarClienteDto,
  ControlUnlockDto,
  DatosSensiblesDto,
} from './dto/cliente.dto';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('clientes')
export class ClientesController {
  constructor(
    private clientes: ClientesService,
    private control: ControlService,
  ) {}

  @Get()
  listar() {
    return this.clientes.listar();
  }

  @Post()
  crear(@Body() dto: CrearClienteDto) {
    return this.clientes.crear(dto);
  }

  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientes.detalle(id);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarClienteDto) {
    return this.clientes.actualizar(id, dto);
  }

  // ─── Control (admin + contraseña) ──────────────────────────────────
  /** Desbloquea el Control: valida la contraseña y emite un token de control. */
  @Roles(Rol.ADMIN)
  @Post(':id/control/unlock')
  async unlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ControlUnlockDto,
    @CurrentUser() user: JwtUser,
  ) {
    if (!this.control.verificarPassword(dto.password)) {
      throw new ForbiddenException('Contraseña de Control incorrecta');
    }
    await this.clientes.detalle(id); // valida que el cliente exista
    const controlToken = await this.control.emitirToken(user.id, id);
    return { controlToken };
  }

  /** Lee los datos sensibles descifrados (admin + token de Control). */
  @Roles(Rol.ADMIN)
  @UseGuards(ControlGuard)
  @Get(':id/datos-sensibles')
  async getDatosSensibles(@Param('id', ParseUUIDPipe) id: string) {
    const datosSensibles = await this.clientes.getDatosSensibles(id);
    return { datosSensibles };
  }

  /** Guarda los datos sensibles cifrados (admin + token de Control). */
  @Roles(Rol.ADMIN)
  @UseGuards(ControlGuard)
  @Put(':id/datos-sensibles')
  async setDatosSensibles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DatosSensiblesDto,
  ) {
    await this.clientes.setDatosSensibles(id, dto.datosSensibles ?? null);
    return { ok: true };
  }
}

import {
  BadRequestException,
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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Rol } from '@prisma/client';
import { TrabajadoresService } from './trabajadores.service';
import { ActualizarTrabajadorDto, CrearTrabajadorDto } from './dto/trabajador.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

const MAX_CONTRATO = 20 * 1024 * 1024;

/** Gestión de trabajadores / fichas de empleado (solo administradores). */
@Roles(Rol.ADMIN)
@Controller('trabajadores')
export class TrabajadoresController {
  constructor(private trabajadores: TrabajadoresService) {}

  @Get()
  listar() {
    return this.trabajadores.listar();
  }

  @Post()
  crear(@Body() dto: CrearTrabajadorDto) {
    return this.trabajadores.crear(dto);
  }

  @Get(':id')
  detalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadores.detalle(id);
  }

  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarTrabajadorDto) {
    return this.trabajadores.actualizar(id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  eliminar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.trabajadores.eliminar(id, user.id);
  }

  // ─── Contrato ──────────────────────────────────────────────────────
  @Post(':id/contrato')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CONTRATO } }))
  subirContrato(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo');
    return this.trabajadores.subirContrato(id, file);
  }

  @Get(':id/contrato/download')
  async descargarContrato(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const c = await this.trabajadores.contratoParaDescarga(id);
    res.download(c.absPath, c.nombre);
  }
}

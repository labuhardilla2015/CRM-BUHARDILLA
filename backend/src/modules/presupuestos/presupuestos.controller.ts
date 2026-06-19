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
import { PresupuestosService } from './presupuestos.service';
import { ActualizarPresupuestoDto, CrearPresupuestoDto } from './dto/presupuesto.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

const MAX_PDF = 20 * 1024 * 1024;

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

  /** Adjunta el PDF del presupuesto. */
  @Post('presupuestos/:id/pdf')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PDF } }))
  subirPdf(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo');
    return this.presupuestos.subirPdf(id, file);
  }

  @Get('presupuestos/:id/pdf/download')
  async descargarPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const f = await this.presupuestos.pdfParaDescarga(id);
    res.download(f.absPath, f.nombre);
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

  /** Descarga del PDF del presupuesto (sin login, por token). */
  @Public()
  @Get(':token/pdf')
  async pdf(@Param('token') token: string, @Res() res: Response) {
    const f = await this.presupuestos.pdfPublicoPorToken(token);
    res.download(f.absPath, f.nombre);
  }
}

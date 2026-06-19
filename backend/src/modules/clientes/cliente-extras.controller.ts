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
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ClienteExtrasService } from './cliente-extras.service';
import { CrearEnlaceDto } from './dto/extras.dto';

const MAX_DOC = 20 * 1024 * 1024;

/** Documentos y enlaces del cliente. Accesible a cualquier empleado. */
@Controller()
export class ClienteExtrasController {
  constructor(private extras: ClienteExtrasService) {}

  // ─── Documentos ────────────────────────────────────────────────────
  @Get('clientes/:id/documentos')
  documentos(@Param('id', ParseUUIDPipe) id: string) {
    return this.extras.listarDocumentos(id);
  }

  @Post('clientes/:id/documentos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOC } }))
  subir(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo');
    return this.extras.subirDocumento(id, file);
  }

  @Get('documentos-cliente/:docId/download')
  async descargar(@Param('docId', ParseUUIDPipe) docId: string, @Res() res: Response) {
    const d = await this.extras.documentoParaDescarga(docId);
    res.download(d.absPath, d.nombre);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('documentos-cliente/:docId')
  borrarDoc(@Param('docId', ParseUUIDPipe) docId: string) {
    return this.extras.eliminarDocumento(docId);
  }

  // ─── Logo ──────────────────────────────────────────────────────────
  @Post('clientes/:id/logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOC } }))
  subirLogo(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta la imagen');
    return this.extras.subirLogo(id, file);
  }

  @Get('clientes/:id/logo')
  async verLogo(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const l = await this.extras.logoParaServir(id);
    res.sendFile(l.absPath);
  }

  // ─── Enlaces / redes ───────────────────────────────────────────────
  @Get('clientes/:id/enlaces')
  enlaces(@Param('id', ParseUUIDPipe) id: string) {
    return this.extras.listarEnlaces(id);
  }

  @Post('clientes/:id/enlaces')
  crearEnlace(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearEnlaceDto) {
    return this.extras.crearEnlace(id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('enlaces-cliente/:enlaceId')
  borrarEnlace(@Param('enlaceId', ParseUUIDPipe) enlaceId: string) {
    return this.extras.eliminarEnlace(enlaceId);
  }
}

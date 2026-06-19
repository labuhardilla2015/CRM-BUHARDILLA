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
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Rol } from '@prisma/client';
import { TarjetaDetalleService } from './tarjeta-detalle.service';
import {
  ActualizarChecklistDto,
  AsignadosDto,
  ChecklistItemDto,
  ComentarioDto,
} from './dto/detalle.dto';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

const MAX_ARCHIVO = 20 * 1024 * 1024; // 20 MB

@Controller()
export class TarjetaDetalleController {
  constructor(private detalle: TarjetaDetalleService) {}

  /** Detalle completo de la tarjeta (comentarios, checklist, archivos, asignados). */
  @Get('tarjetas/:id')
  detalleTarjeta(@Param('id', ParseUUIDPipe) id: string) {
    return this.detalle.detalle(id);
  }

  // ─── Comentarios ───────────────────────────────────────────────────
  @Post('tarjetas/:id/comentarios')
  comentar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ComentarioDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.detalle.crearComentario(id, user.id, dto.texto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('comentarios/:id')
  borrarComentario(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.detalle.eliminarComentario(id, { id: user.id, rol: user.rol as Rol });
  }

  // ─── Checklist ─────────────────────────────────────────────────────
  @Post('tarjetas/:id/checklist')
  addChecklist(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChecklistItemDto) {
    return this.detalle.crearChecklistItem(id, dto.texto);
  }

  @Patch('checklist/:itemId')
  patchChecklist(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ActualizarChecklistDto,
  ) {
    return this.detalle.actualizarChecklistItem(itemId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist/:itemId')
  borrarChecklist(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.detalle.eliminarChecklistItem(itemId);
  }

  // ─── Asignaciones ──────────────────────────────────────────────────
  @Put('tarjetas/:id/asignados')
  asignar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AsignadosDto) {
    return this.detalle.setAsignados(id, dto.usuarioIds);
  }

  // ─── Archivos ──────────────────────────────────────────────────────
  @Post('tarjetas/:id/archivos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ARCHIVO } }))
  subir(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) throw new BadRequestException('Falta el archivo');
    return this.detalle.guardarArchivo(id, user.id, file);
  }

  @Get('archivos/:id/download')
  async descargar(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const a = await this.detalle.archivoParaDescarga(id);
    res.download(a.absPath, a.nombre);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('archivos/:id')
  borrarArchivo(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.detalle.eliminarArchivo(id, { id: user.id, rol: user.rol as Rol });
  }
}

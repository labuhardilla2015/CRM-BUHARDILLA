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

  // ─── Foto ──────────────────────────────────────────────────────────
  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CONTRATO } }))
  subirFoto(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta la imagen');
    return this.trabajadores.subirFoto(id, file);
  }

  @Get(':id/foto')
  async verFoto(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const f = await this.trabajadores.fotoParaServir(id);
    res.sendFile(f.absPath);
  }

  // ─── Documentos del expediente ─────────────────────────────────────
  @Get(':id/documentos')
  documentos(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadores.listarDocumentos(id);
  }

  @Post(':id/documentos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CONTRATO } }))
  subirDoc(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Falta el archivo');
    return this.trabajadores.subirDocumento(id, file);
  }

  @Get(':id/documentos/:docId/download')
  async descargarDoc(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Res() res: Response,
  ) {
    const d = await this.trabajadores.documentoParaDescarga(id, docId);
    res.download(d.absPath, d.nombre);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/documentos/:docId')
  borrarDoc(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
  ) {
    return this.trabajadores.eliminarDocumento(id, docId);
  }
}

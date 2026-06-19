import { AccionTiempo } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Arrancar el cronómetro: cliente + acción (inicio = ahora en el backend). */
export class StartRegistroDto {
  @IsUUID()
  clienteId!: string;

  @IsEnum(AccionTiempo)
  accion!: AccionTiempo;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}

/** Crear un registro manual (con inicio y fin), p. ej. desde el calendario. */
export class CrearRegistroDto {
  @IsUUID()
  clienteId!: string;

  @IsEnum(AccionTiempo)
  accion!: AccionTiempo;

  @IsDateString()
  inicio!: string;

  @IsDateString()
  fin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}

/** Editar un registro existente (todo opcional). */
export class ActualizarRegistroDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsEnum(AccionTiempo)
  accion?: AccionTiempo;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}

/** Filtros del listado de registros (semana del calendario, informes…). */
export class RegistrosQueryDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}

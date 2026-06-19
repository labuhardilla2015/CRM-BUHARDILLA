import { EstadoTarjeta, TipoTablero } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearTarjetaDto {
  @IsEnum(TipoTablero)
  tipo!: TipoTablero;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstadoTarjeta)
  estado?: EstadoTarjeta;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

export class ActualizarTarjetaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstadoTarjeta)
  estado?: EstadoTarjeta;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progreso?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}

export class TarjetasQueryDto {
  @IsOptional()
  @IsEnum(TipoTablero)
  tipo?: TipoTablero;

  /** Filtra por trabajador asignado. */
  @IsOptional()
  @IsUUID()
  asignadoId?: string;

  /** Solo tareas activas (no HECHO). */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activas?: boolean;
}

import { SeccionClave } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearClaveDto {
  @IsEnum(SeccionClave)
  seccion!: SeccionClave;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  etiqueta!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  secreto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notas?: string;
}

export class ActualizarClaveDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  etiqueta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  secreto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notas?: string;
}

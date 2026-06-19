import { EstadoPotencial } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearPotencialDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  origen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notas?: string;
}

export class ActualizarPotencialDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  origen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notas?: string;

  @IsOptional()
  @IsEnum(EstadoPotencial)
  estado?: EstadoPotencial;
}

import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  notas?: string;
}

export class ControlUnlockDto {
  @IsString()
  password!: string;
}

export class DatosSensiblesDto {
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  datosSensibles?: string;
}

import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Datos que envía el formulario de la web pública. */
export class LeadPublicoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  mensaje?: string;

  /** Token de seguridad (también se puede mandar en la cabecera X-Form-Token). */
  @IsOptional()
  @IsString()
  token?: string;
}

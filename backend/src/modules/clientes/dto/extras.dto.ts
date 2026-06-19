import { TipoEnlace } from '@prisma/client';
import { IsEnum, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CrearEnlaceDto {
  @IsEnum(TipoEnlace)
  tipo!: TipoEnlace;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  etiqueta!: string;

  @IsUrl({ require_protocol: true }, { message: 'La URL debe incluir http(s)://' })
  @MaxLength(500)
  url!: string;
}

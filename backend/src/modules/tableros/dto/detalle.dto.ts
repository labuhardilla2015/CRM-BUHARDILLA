import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ComentarioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  texto!: string;
}

export class ChecklistItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  texto!: string;
}

export class ActualizarChecklistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  texto?: string;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;
}

export class AsignadosDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  usuarioIds!: string[];
}

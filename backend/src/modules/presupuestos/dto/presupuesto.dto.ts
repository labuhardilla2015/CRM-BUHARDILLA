import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CrearPresupuestoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  concepto!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  detalle?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto!: number;
}

export class ActualizarPresupuestoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  concepto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  detalle?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto?: number;
}

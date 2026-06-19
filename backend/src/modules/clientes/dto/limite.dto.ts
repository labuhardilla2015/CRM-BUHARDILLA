import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class SetLimiteDto {
  /** Horas/mes para esa acción. 0 elimina el límite. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  horas!: number;
}

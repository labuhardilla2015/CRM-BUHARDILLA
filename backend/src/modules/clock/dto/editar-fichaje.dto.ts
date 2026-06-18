import { IsDateString, IsOptional } from 'class-validator';

/** Edición de marcas por un ADMIN. Ambos campos opcionales (se actualiza lo que venga). */
export class EditarFichajeDto {
  @IsOptional()
  @IsDateString({}, { message: 'inicio debe ser una fecha ISO válida' })
  inicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fin debe ser una fecha ISO válida' })
  fin?: string;
}

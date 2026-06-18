import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Filtros del historial de fichajes. `usuarioId` solo lo aplica un ADMIN. */
export class HistorialQueryDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}

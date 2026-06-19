import { AccionTiempo } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

/** Filtros del informe de tiempo. `usuarioId` solo lo aplica un ADMIN. */
export class InformeQueryDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsEnum(AccionTiempo)
  accion?: AccionTiempo;
}

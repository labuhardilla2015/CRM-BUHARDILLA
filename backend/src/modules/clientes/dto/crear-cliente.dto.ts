import { IsString, MaxLength, MinLength } from 'class-validator';

export class CrearClienteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  nombre!: string;
}

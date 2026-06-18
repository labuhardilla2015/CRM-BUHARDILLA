import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password!: string;
}

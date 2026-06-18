import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(180)
  email!: string;

  @IsString()
  password!: string;
}

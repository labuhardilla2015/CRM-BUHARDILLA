import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Esquema de variables de entorno. Si falta o es inválida alguna crítica,
 * la app no arranca (fail-fast), evitando configuraciones inseguras.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL = 'http://localhost:5173';

  @IsString()
  @MinLength(16, { message: 'JWT_ACCESS_SECRET debe tener al menos 16 caracteres' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET debe tener al menos 16 caracteres' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsString()
  @MinLength(64, { message: 'ENCRYPTION_KEY debe ser 32 bytes en hex (64 caracteres)' })
  @IsOptional()
  ENCRYPTION_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      'Configuración de entorno inválida:\n' +
        errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n'),
    );
  }
  return validated;
}

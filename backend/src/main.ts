import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Seguridad: cabeceras HTTP endurecidas
  app.use(helmet());
  app.use(cookieParser());

  // CORS restrictivo: solo el frontend, con credenciales (cookies refresh)
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  // Validación global de DTOs + saneado de payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API escuchando en http://localhost:${port}/api`);
}

bootstrap();

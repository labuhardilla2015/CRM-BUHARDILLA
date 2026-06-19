import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClockModule } from './modules/clock/clock.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { TablerosModule } from './modules/tableros/tableros.module';
import { PotencialesModule } from './modules/potenciales/potenciales.module';
import { PresupuestosModule } from './modules/presupuestos/presupuestos.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Límite global por IP: 100 peticiones por minuto
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    CryptoModule,
    UsersModule,
    AuthModule,
    ClockModule,
    ClientesModule,
    TablerosModule,
    PotencialesModule,
    PresupuestosModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    // Rate limiting global (antes que el resto de guards)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // JWT en TODA la API por defecto; se abren endpoints con @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Comprobación de rol cuando un endpoint usa @Roles()
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

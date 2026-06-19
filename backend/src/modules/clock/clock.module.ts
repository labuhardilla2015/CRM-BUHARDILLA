import { Module } from '@nestjs/common';
import { FichajesService } from './fichajes.service';
import { FichajesController } from './fichajes.controller';
import { RegistrosService } from './registros.service';
import { RegistrosController } from './registros.controller';

@Module({
  controllers: [FichajesController, RegistrosController],
  providers: [FichajesService, RegistrosService],
})
export class ClockModule {}

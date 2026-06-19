import { Module } from '@nestjs/common';
import { FichajesService } from './fichajes.service';
import { FichajesController } from './fichajes.controller';
import { RegistrosService } from './registros.service';
import { RegistrosController } from './registros.controller';
import { InformesService } from './informes.service';
import { InformesController } from './informes.controller';

@Module({
  controllers: [FichajesController, RegistrosController, InformesController],
  providers: [FichajesService, RegistrosService, InformesService],
})
export class ClockModule {}

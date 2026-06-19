import { Module } from '@nestjs/common';
import { PresupuestosService } from './presupuestos.service';
import {
  PresupuestosController,
  PresupuestosPublicoController,
} from './presupuestos.controller';

@Module({
  controllers: [PresupuestosController, PresupuestosPublicoController],
  providers: [PresupuestosService],
})
export class PresupuestosModule {}

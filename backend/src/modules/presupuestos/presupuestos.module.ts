import { Module } from '@nestjs/common';
import { PresupuestosService } from './presupuestos.service';
import {
  PresupuestosController,
  PresupuestosPublicoController,
} from './presupuestos.controller';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [PresupuestosController, PresupuestosPublicoController],
  providers: [PresupuestosService],
})
export class PresupuestosModule {}

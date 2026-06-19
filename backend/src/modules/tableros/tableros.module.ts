import { Module } from '@nestjs/common';
import { TablerosService } from './tableros.service';
import { TablerosController } from './tableros.controller';
import { TarjetaDetalleService } from './tarjeta-detalle.service';
import { TarjetaDetalleController } from './tarjeta-detalle.controller';
import { VencimientosService } from './vencimientos.service';
import { StorageModule } from '../../common/storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [TablerosController, TarjetaDetalleController],
  providers: [TablerosService, TarjetaDetalleService, VencimientosService],
  exports: [TablerosService],
})
export class TablerosModule {}

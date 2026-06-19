import { Module } from '@nestjs/common';
import { TablerosService } from './tableros.service';
import { TablerosController } from './tableros.controller';
import { TarjetaDetalleService } from './tarjeta-detalle.service';
import { TarjetaDetalleController } from './tarjeta-detalle.controller';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [TablerosController, TarjetaDetalleController],
  providers: [TablerosService, TarjetaDetalleService],
  exports: [TablerosService],
})
export class TablerosModule {}

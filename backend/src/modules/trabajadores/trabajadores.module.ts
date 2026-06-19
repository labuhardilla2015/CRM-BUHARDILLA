import { Module } from '@nestjs/common';
import { TrabajadoresService } from './trabajadores.service';
import { TrabajadoresController } from './trabajadores.controller';
import { MailProvisioningService } from './mail-provisioning.service';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [TrabajadoresController],
  providers: [TrabajadoresService, MailProvisioningService],
})
export class TrabajadoresModule {}

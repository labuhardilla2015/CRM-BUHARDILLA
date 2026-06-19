import { Module } from '@nestjs/common';
import { PotencialesService } from './potenciales.service';
import { PotencialesController, PotencialesPublicoController } from './potenciales.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PotencialesController, PotencialesPublicoController],
  providers: [PotencialesService],
  exports: [PotencialesService],
})
export class PotencialesModule {}

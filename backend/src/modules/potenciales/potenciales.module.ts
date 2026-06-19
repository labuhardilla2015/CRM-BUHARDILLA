import { Module } from '@nestjs/common';
import { PotencialesService } from './potenciales.service';
import { PotencialesController } from './potenciales.controller';

@Module({
  controllers: [PotencialesController],
  providers: [PotencialesService],
  exports: [PotencialesService],
})
export class PotencialesModule {}

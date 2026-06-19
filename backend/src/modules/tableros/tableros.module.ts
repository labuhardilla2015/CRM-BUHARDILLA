import { Module } from '@nestjs/common';
import { TablerosService } from './tableros.service';
import { TablerosController } from './tableros.controller';

@Module({
  controllers: [TablerosController],
  providers: [TablerosService],
  exports: [TablerosService],
})
export class TablerosModule {}

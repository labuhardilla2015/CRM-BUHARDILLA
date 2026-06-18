import { Module } from '@nestjs/common';
import { FichajesService } from './fichajes.service';
import { FichajesController } from './fichajes.controller';

@Module({
  controllers: [FichajesController],
  providers: [FichajesService],
})
export class ClockModule {}

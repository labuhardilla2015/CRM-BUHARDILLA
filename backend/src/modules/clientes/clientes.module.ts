import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ControlService } from './control.service';
import { ControlGuard } from './control.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ClientesController],
  providers: [ClientesService, ControlService, ControlGuard],
  exports: [ClientesService],
})
export class ClientesModule {}

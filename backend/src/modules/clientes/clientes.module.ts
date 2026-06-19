import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ControlService } from './control.service';
import { ControlGuard } from './control.guard';
import { ClavesService } from './claves.service';
import { ClavesController } from './claves.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ClientesController, ClavesController],
  providers: [ClientesService, ControlService, ControlGuard, ClavesService],
  exports: [ClientesService],
})
export class ClientesModule {}

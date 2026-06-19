import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ControlService } from './control.service';
import { ControlGuard } from './control.guard';
import { ClavesService } from './claves.service';
import { ClavesController } from './claves.controller';
import { ClienteExtrasService } from './cliente-extras.service';
import { ClienteExtrasController } from './cliente-extras.controller';
import { LimitesService } from './limites.service';
import { LimitesController } from './limites.controller';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [JwtModule.register({}), StorageModule],
  controllers: [ClientesController, ClavesController, ClienteExtrasController, LimitesController],
  providers: [ClientesService, ControlService, ControlGuard, ClavesService, ClienteExtrasService, LimitesService],
  exports: [ClientesService],
})
export class ClientesModule {}

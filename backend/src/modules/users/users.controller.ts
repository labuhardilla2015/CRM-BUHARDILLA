import { Controller, Get } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  /** Listado de usuarios (solo ADMIN) para filtros de informes/asignaciones. */
  @Roles(Rol.ADMIN)
  @Get()
  listar() {
    return this.users.listar();
  }
}

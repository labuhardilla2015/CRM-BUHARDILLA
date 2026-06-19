import { Controller, Get, Query } from '@nestjs/common';
import { Rol } from '@prisma/client';
import { InformesService } from './informes.service';
import { InformeQueryDto } from './dto/informe-query.dto';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@Controller('clock/informes')
export class InformesController {
  constructor(private informes: InformesService) {}

  /** Resumen agregado de tiempo (total + desglose por cliente/acción/persona). */
  @Get()
  resumen(@CurrentUser() user: JwtUser, @Query() query: InformeQueryDto) {
    return this.informes.resumen({ id: user.id, rol: user.rol as Rol }, query);
  }
}

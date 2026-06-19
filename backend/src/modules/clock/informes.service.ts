import { Injectable } from '@nestjs/common';
import { AccionTiempo, Rol } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InformeQueryDto } from './dto/informe-query.dto';

interface ItemAgrupado {
  clave: string;
  etiqueta: string;
  segundos: number;
}

export interface ResumenInforme {
  totalSegundos: number;
  numRegistros: number;
  porCliente: ItemAgrupado[];
  porAccion: ItemAgrupado[];
  porUsuario: ItemAgrupado[];
}

@Injectable()
export class InformesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Agrega el tiempo registrado (solo registros cerrados) según los filtros.
   * Un TRABAJADOR queda restringido a sus propios datos; un ADMIN puede ver
   * todos o filtrar por persona.
   */
  async resumen(
    solicitante: { id: string; rol: Rol },
    query: InformeQueryDto,
  ): Promise<ResumenInforme> {
    const esAdmin = solicitante.rol === Rol.ADMIN;
    const usuarioId = esAdmin ? query.usuarioId : solicitante.id;

    const registros = await this.prisma.registroTiempo.findMany({
      where: {
        fin: { not: null },
        ...(usuarioId ? { usuarioId } : {}),
        ...(query.clienteId ? { clienteId: query.clienteId } : {}),
        ...(query.accion ? { accion: query.accion } : {}),
        ...(query.desde || query.hasta
          ? {
              inicio: {
                ...(query.desde ? { gte: new Date(query.desde) } : {}),
                ...(query.hasta ? { lte: new Date(query.hasta) } : {}),
              },
            }
          : {}),
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true } },
      },
    });

    const cliente = new Map<string, ItemAgrupado>();
    const accion = new Map<string, ItemAgrupado>();
    const usuario = new Map<string, ItemAgrupado>();
    let total = 0;

    for (const r of registros) {
      const seg = Math.max(0, (r.fin!.getTime() - r.inicio.getTime()) / 1000);
      total += seg;
      acumular(cliente, r.clienteId, r.cliente.nombre, seg);
      acumular(accion, r.accion, etiquetaAccion(r.accion), seg);
      acumular(usuario, r.usuarioId, r.usuario.nombre, seg);
    }

    const ordenar = (m: Map<string, ItemAgrupado>) =>
      [...m.values()].sort((a, b) => b.segundos - a.segundos);

    return {
      totalSegundos: Math.round(total),
      numRegistros: registros.length,
      porCliente: ordenar(cliente),
      porAccion: ordenar(accion),
      porUsuario: ordenar(usuario),
    };
  }
}

function acumular(map: Map<string, ItemAgrupado>, clave: string, etiqueta: string, seg: number) {
  const actual = map.get(clave);
  if (actual) actual.segundos += seg;
  else map.set(clave, { clave, etiqueta, segundos: seg });
}

function etiquetaAccion(a: AccionTiempo): string {
  const labels: Record<AccionTiempo, string> = {
    SEO: 'SEO',
    WEB: 'Web',
    RRSS: 'RRSS',
    DISENO: 'Diseño',
    INFORMES: 'Informes',
    SEO_LOCAL: 'SEO Local',
    ADS: 'Ads',
    ADMINISTRACION: 'Administración',
    ESTRATEGIA: 'Estrategia',
    EMAIL_MARKETING: 'Email Marketing',
  };
  return labels[a];
}

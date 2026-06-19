import { api } from './api';
import type { AccionTiempo } from './registros-api';

export interface ItemAgrupado {
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

export interface FiltrosInforme {
  desde?: string;
  hasta?: string;
  usuarioId?: string;
  clienteId?: string;
  accion?: AccionTiempo;
}

export async function getResumen(filtros: FiltrosInforme): Promise<ResumenInforme> {
  const { data } = await api.get<ResumenInforme>('/clock/informes', { params: filtros });
  return data;
}

export interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'TRABAJADOR';
}

export async function getUsuarios(): Promise<UsuarioBasico[]> {
  const { data } = await api.get<UsuarioBasico[]>('/users');
  return data;
}

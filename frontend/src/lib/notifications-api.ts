import { api } from './api';

export type TipoNotificacion =
  | 'TARJETA_ASIGNADA'
  | 'POTENCIAL'
  | 'REUNION'
  | 'LIMITE_HORAS'
  | 'VENCIMIENTO_TAREA';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  entidadTipo: string | null;
  entidadId: string | null;
  fechaFin: string | null;
  leida: boolean;
  createdAt: string;
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  const { data } = await api.get<Notificacion[]>('/notificaciones');
  return data;
}

export async function getNoLeidas(): Promise<number> {
  const { data } = await api.get<{ total: number }>('/notificaciones/no-leidas');
  return data.total;
}

export async function marcarLeida(id: string): Promise<void> {
  await api.patch(`/notificaciones/${id}/leida`);
}

export async function marcarTodasLeidas(): Promise<void> {
  await api.post('/notificaciones/leer-todas');
}

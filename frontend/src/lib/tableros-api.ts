import { api } from './api';

export type TipoTablero =
  | 'INFORMACION'
  | 'ADS'
  | 'SEO'
  | 'WEB'
  | 'DISENO'
  | 'REDES'
  | 'ESTRATEGICO'
  | 'AUDIOVISUAL';

export type EstadoTarjeta = 'PENDIENTE' | 'EN_CURSO' | 'HECHO';

export const TIPOS_TABLERO: { value: TipoTablero; label: string }[] = [
  { value: 'INFORMACION', label: 'Información' },
  { value: 'ADS', label: 'Ads' },
  { value: 'SEO', label: 'SEO' },
  { value: 'WEB', label: 'Web' },
  { value: 'DISENO', label: 'Diseño' },
  { value: 'REDES', label: 'Redes' },
  { value: 'ESTRATEGICO', label: 'Estratégico' },
  { value: 'AUDIOVISUAL', label: 'Audiovisual' },
];

export const TIPO_LABEL: Record<TipoTablero, string> = Object.fromEntries(
  TIPOS_TABLERO.map((t) => [t.value, t.label]),
) as Record<TipoTablero, string>;

export const ESTADOS: { value: EstadoTarjeta; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'HECHO', label: 'Hecho' },
];

export const ESTADO_LABEL: Record<EstadoTarjeta, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  HECHO: 'Hecho',
};

export interface Tarjeta {
  id: string;
  tableroId: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarjeta;
  fechaInicio: string | null;
  fechaFin: string | null;
  progreso: number;
  orden: number;
  tablero?: { tipo: TipoTablero; clienteId: string };
}

export interface TableroResumen {
  id: string;
  tipo: TipoTablero;
  total: number;
  activas: number;
}

export interface CrearTarjeta {
  tipo: TipoTablero;
  titulo: string;
  descripcion?: string;
  estado?: EstadoTarjeta;
  fechaInicio?: string;
  fechaFin?: string;
}

export async function getTableros(clienteId: string): Promise<TableroResumen[]> {
  const { data } = await api.get<TableroResumen[]>(`/clientes/${clienteId}/tableros`);
  return data;
}

export async function getTarjetas(clienteId: string, tipo?: TipoTablero): Promise<Tarjeta[]> {
  const { data } = await api.get<Tarjeta[]>(`/clientes/${clienteId}/tarjetas`, {
    params: tipo ? { tipo } : {},
  });
  return data;
}

export async function crearTarjeta(clienteId: string, body: CrearTarjeta): Promise<Tarjeta> {
  const { data } = await api.post<Tarjeta>(`/clientes/${clienteId}/tarjetas`, body);
  return data;
}

export async function actualizarTarjeta(
  id: string,
  body: Partial<Omit<CrearTarjeta, 'tipo'>> & { estado?: EstadoTarjeta; progreso?: number; orden?: number },
): Promise<Tarjeta> {
  const { data } = await api.patch<Tarjeta>(`/tarjetas/${id}`, body);
  return data;
}

export async function eliminarTarjeta(id: string): Promise<void> {
  await api.delete(`/tarjetas/${id}`);
}

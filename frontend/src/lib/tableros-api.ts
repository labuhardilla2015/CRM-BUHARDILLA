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

export interface Asignado {
  usuarioId: string;
  usuario: { id: string; nombre: string };
}

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
  asignaciones?: Asignado[];
  _count?: { comentarios: number; archivos: number; checklistItems: number };
}

export interface Comentario {
  id: string;
  usuarioId: string;
  texto: string;
  createdAt: string;
  usuario: { id: string; nombre: string };
}

export interface ChecklistItem {
  id: string;
  texto: string;
  completado: boolean;
  orden: number;
}

export interface Archivo {
  id: string;
  usuarioId: string;
  nombre: string;
  mime: string;
  tamano: number;
  createdAt: string;
  usuario: { id: string; nombre: string };
}

export interface TarjetaDetalle extends Tarjeta {
  comentarios: Comentario[];
  checklistItems: ChecklistItem[];
  archivos: Archivo[];
  asignaciones: Asignado[];
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

// ─── Detalle de tarjeta (comentarios, checklist, archivos, asignados) ──
export async function getTarjetaDetalle(id: string): Promise<TarjetaDetalle> {
  const { data } = await api.get<TarjetaDetalle>(`/tarjetas/${id}`);
  return data;
}

export async function comentar(tarjetaId: string, texto: string): Promise<Comentario> {
  const { data } = await api.post<Comentario>(`/tarjetas/${tarjetaId}/comentarios`, { texto });
  return data;
}

export async function borrarComentario(id: string): Promise<void> {
  await api.delete(`/comentarios/${id}`);
}

export async function addChecklist(tarjetaId: string, texto: string): Promise<ChecklistItem> {
  const { data } = await api.post<ChecklistItem>(`/tarjetas/${tarjetaId}/checklist`, { texto });
  return data;
}

export async function patchChecklist(
  itemId: string,
  body: { texto?: string; completado?: boolean },
): Promise<ChecklistItem> {
  const { data } = await api.patch<ChecklistItem>(`/checklist/${itemId}`, body);
  return data;
}

export async function borrarChecklist(itemId: string): Promise<void> {
  await api.delete(`/checklist/${itemId}`);
}

export async function setAsignados(tarjetaId: string, usuarioIds: string[]): Promise<Asignado[]> {
  const { data } = await api.put<Asignado[]>(`/tarjetas/${tarjetaId}/asignados`, { usuarioIds });
  return data;
}

export async function subirArchivo(tarjetaId: string, file: File): Promise<Archivo> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<Archivo>(`/tarjetas/${tarjetaId}/archivos`, form);
  return data;
}

export async function borrarArchivo(id: string): Promise<void> {
  await api.delete(`/archivos/${id}`);
}

/** Descarga el archivo (con el token) y dispara la descarga en el navegador. */
export async function descargarArchivo(id: string, nombre: string): Promise<void> {
  const res = await api.get(`/archivos/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

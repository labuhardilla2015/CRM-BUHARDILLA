import { api } from './api';

export type AccionTiempo =
  | 'SEO'
  | 'WEB'
  | 'RRSS'
  | 'DISENO'
  | 'INFORMES'
  | 'SEO_LOCAL'
  | 'ADS'
  | 'ADMINISTRACION'
  | 'ESTRATEGIA'
  | 'EMAIL_MARKETING';

export const ACCIONES: { value: AccionTiempo; label: string }[] = [
  { value: 'SEO', label: 'SEO' },
  { value: 'WEB', label: 'Web' },
  { value: 'RRSS', label: 'RRSS' },
  { value: 'DISENO', label: 'Diseño' },
  { value: 'INFORMES', label: 'Informes' },
  { value: 'SEO_LOCAL', label: 'SEO Local' },
  { value: 'ADS', label: 'Ads' },
  { value: 'ADMINISTRACION', label: 'Administración' },
  { value: 'ESTRATEGIA', label: 'Estrategia' },
  { value: 'EMAIL_MARKETING', label: 'Email Marketing' },
];

export const ACCION_LABEL: Record<AccionTiempo, string> = Object.fromEntries(
  ACCIONES.map((a) => [a.value, a.label]),
) as Record<AccionTiempo, string>;

/** Color (clases Tailwind) por acción, para el calendario y los informes. */
export const ACCION_COLOR: Record<AccionTiempo, { bg: string; text: string; dot: string }> = {
  SEO: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  WEB: { bg: 'bg-sky-100', text: 'text-sky-800', dot: 'bg-sky-500' },
  RRSS: { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' },
  DISENO: { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500' },
  INFORMES: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  SEO_LOCAL: { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  ADS: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  ADMINISTRACION: { bg: 'bg-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
  ESTRATEGIA: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  EMAIL_MARKETING: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
};

export interface RegistroTiempo {
  id: string;
  usuarioId: string;
  clienteId: string;
  accion: AccionTiempo;
  inicio: string;
  fin: string | null;
  descripcion: string | null;
  cliente?: { id: string; nombre: string };
  usuario?: { id: string; nombre: string };
}

export interface StartRegistro {
  clienteId: string;
  accion: AccionTiempo;
  descripcion?: string;
}

export interface CrearRegistro {
  clienteId: string;
  accion: AccionTiempo;
  inicio: string;
  fin: string;
  descripcion?: string;
}

export async function getCorriendo(): Promise<RegistroTiempo | null> {
  const { data } = await api.get<RegistroTiempo | ''>('/clock/registros/corriendo');
  return data || null;
}

export async function startRegistro(body: StartRegistro): Promise<RegistroTiempo> {
  const { data } = await api.post<RegistroTiempo>('/clock/registros/start', body);
  return data;
}

export async function stopRegistro(): Promise<RegistroTiempo> {
  const { data } = await api.post<RegistroTiempo>('/clock/registros/stop');
  return data;
}

export async function getRegistros(
  desde: string,
  hasta: string,
  usuarioId?: string,
): Promise<RegistroTiempo[]> {
  const { data } = await api.get<RegistroTiempo[]>('/clock/registros', {
    params: { desde, hasta, ...(usuarioId ? { usuarioId } : {}) },
  });
  return data;
}

export async function crearRegistro(body: CrearRegistro): Promise<RegistroTiempo> {
  const { data } = await api.post<RegistroTiempo>('/clock/registros', body);
  return data;
}

export async function actualizarRegistro(
  id: string,
  body: Partial<CrearRegistro>,
): Promise<RegistroTiempo> {
  const { data } = await api.patch<RegistroTiempo>(`/clock/registros/${id}`, body);
  return data;
}

export async function eliminarRegistro(id: string): Promise<void> {
  await api.delete(`/clock/registros/${id}`);
}

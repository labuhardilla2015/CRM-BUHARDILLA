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

export async function getRegistros(desde: string, hasta: string): Promise<RegistroTiempo[]> {
  const { data } = await api.get<RegistroTiempo[]>('/clock/registros', {
    params: { desde, hasta },
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

import { api } from './api';

export type Rol = 'ADMIN' | 'TRABAJADOR';

export interface Trabajador {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  dni: string | null;
  telefono: string | null;
  puesto: string | null;
  enPracticas: boolean;
  contratoNombre: string | null;
  fotoRuta: string | null;
  createdAt: string;
}

export interface DocumentoEmpleado {
  id: string;
  nombre: string;
  mime: string;
  tamano: number;
  createdAt: string;
}

export interface CrearTrabajador {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  dni?: string;
  telefono?: string;
  puesto?: string;
  enPracticas?: boolean;
}

export interface ActualizarTrabajador {
  nombre?: string;
  rol?: Rol;
  dni?: string;
  telefono?: string;
  puesto?: string;
  enPracticas?: boolean;
  activo?: boolean;
  password?: string;
}

export async function getTrabajadores(): Promise<Trabajador[]> {
  const { data } = await api.get<Trabajador[]>('/trabajadores');
  return data;
}

export async function getTrabajador(id: string): Promise<Trabajador> {
  const { data } = await api.get<Trabajador>(`/trabajadores/${id}`);
  return data;
}

export async function crearTrabajador(body: CrearTrabajador): Promise<Trabajador> {
  const { data } = await api.post<Trabajador>('/trabajadores', body);
  return data;
}

export async function actualizarTrabajador(id: string, body: ActualizarTrabajador): Promise<Trabajador> {
  const { data } = await api.patch<Trabajador>(`/trabajadores/${id}`, body);
  return data;
}

export async function eliminarTrabajador(id: string): Promise<void> {
  await api.delete(`/trabajadores/${id}`);
}

export async function subirContrato(id: string, file: File): Promise<Trabajador> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<Trabajador>(`/trabajadores/${id}/contrato`, form);
  return data;
}

export async function descargarContrato(id: string, nombre: string): Promise<void> {
  const res = await api.get(`/trabajadores/${id}/contrato/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Foto ────────────────────────────────────────────────────────────
export async function subirFoto(id: string, file: File): Promise<Trabajador> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<Trabajador>(`/trabajadores/${id}/foto`, form);
  return data;
}

/** Descarga la foto (con el token) y devuelve un object URL para <img>. */
export async function getFotoUrl(id: string): Promise<string> {
  const res = await api.get(`/trabajadores/${id}/foto`, { responseType: 'blob' });
  return URL.createObjectURL(res.data as Blob);
}

// ─── Documentos del expediente ───────────────────────────────────────
export async function getDocumentosEmpleado(id: string): Promise<DocumentoEmpleado[]> {
  const { data } = await api.get<DocumentoEmpleado[]>(`/trabajadores/${id}/documentos`);
  return data;
}

export async function subirDocumentoEmpleado(id: string, file: File): Promise<DocumentoEmpleado> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<DocumentoEmpleado>(`/trabajadores/${id}/documentos`, form);
  return data;
}

export async function eliminarDocumentoEmpleado(id: string, docId: string): Promise<void> {
  await api.delete(`/trabajadores/${id}/documentos/${docId}`);
}

export async function descargarDocumentoEmpleado(id: string, docId: string, nombre: string): Promise<void> {
  const res = await api.get(`/trabajadores/${id}/documentos/${docId}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

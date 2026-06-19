import { api } from './api';

export interface Cliente {
  id: string;
  nombre: string;
  contacto: string | null;
  notas: string | null;
  activo: boolean;
  createdAt: string;
}

export interface ActualizarCliente {
  nombre?: string;
  contacto?: string;
  notas?: string;
}

export async function getClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>('/clientes');
  return data;
}

export async function getCliente(id: string): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
}

export async function crearCliente(nombre: string): Promise<Cliente> {
  const { data } = await api.post<Cliente>('/clientes', { nombre });
  return data;
}

export async function actualizarCliente(id: string, body: ActualizarCliente): Promise<Cliente> {
  const { data } = await api.patch<Cliente>(`/clientes/${id}`, body);
  return data;
}

// ─── Control (admin + contraseña) ────────────────────────────────────
export async function unlockControl(id: string, password: string): Promise<string> {
  const { data } = await api.post<{ controlToken: string }>(`/clientes/${id}/control/unlock`, {
    password,
  });
  return data.controlToken;
}

export async function getDatosSensibles(id: string, controlToken: string): Promise<string | null> {
  const { data } = await api.get<{ datosSensibles: string | null }>(
    `/clientes/${id}/datos-sensibles`,
    { headers: { 'X-Control-Token': controlToken } },
  );
  return data.datosSensibles;
}

export async function setDatosSensibles(
  id: string,
  controlToken: string,
  datosSensibles: string,
): Promise<void> {
  await api.put(
    `/clientes/${id}/datos-sensibles`,
    { datosSensibles },
    { headers: { 'X-Control-Token': controlToken } },
  );
}

// ─── Hoja de claves (cifrada, bajo Control) ──────────────────────────
export type SeccionClave = 'CLAVE' | 'SERVIDOR';

export interface Clave {
  id: string;
  seccion: SeccionClave;
  etiqueta: string;
  url: string | null;
  usuario: string | null;
  secreto: string | null;
  notas: string | null;
  orden: number;
}

export interface ClaveInput {
  seccion?: SeccionClave;
  etiqueta?: string;
  url?: string;
  usuario?: string;
  secreto?: string;
  notas?: string;
}

// Las claves son accesibles a cualquier empleado autenticado (uso diario).
export async function getClaves(id: string): Promise<Clave[]> {
  const { data } = await api.get<Clave[]>(`/clientes/${id}/claves`);
  return data;
}

export async function crearClave(id: string, body: ClaveInput): Promise<Clave> {
  const { data } = await api.post<Clave>(`/clientes/${id}/claves`, body);
  return data;
}

export async function actualizarClave(id: string, claveId: string, body: ClaveInput): Promise<Clave> {
  const { data } = await api.patch<Clave>(`/clientes/${id}/claves/${claveId}`, body);
  return data;
}

export async function eliminarClave(id: string, claveId: string): Promise<void> {
  await api.delete(`/clientes/${id}/claves/${claveId}`);
}

// ─── Documentos del cliente ──────────────────────────────────────────
export interface DocumentoCliente {
  id: string;
  nombre: string;
  mime: string;
  tamano: number;
  createdAt: string;
}

export async function getDocumentosCliente(id: string): Promise<DocumentoCliente[]> {
  const { data } = await api.get<DocumentoCliente[]>(`/clientes/${id}/documentos`);
  return data;
}

export async function subirDocumentoCliente(id: string, file: File): Promise<DocumentoCliente> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<DocumentoCliente>(`/clientes/${id}/documentos`, form);
  return data;
}

export async function eliminarDocumentoCliente(docId: string): Promise<void> {
  await api.delete(`/documentos-cliente/${docId}`);
}

export async function descargarDocumentoCliente(docId: string, nombre: string): Promise<void> {
  const res = await api.get(`/documentos-cliente/${docId}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Enlaces / redes sociales ────────────────────────────────────────
export type TipoEnlace = 'ENLACE' | 'RED_SOCIAL';

export interface EnlaceCliente {
  id: string;
  tipo: TipoEnlace;
  etiqueta: string;
  url: string;
}

export async function getEnlaces(id: string): Promise<EnlaceCliente[]> {
  const { data } = await api.get<EnlaceCliente[]>(`/clientes/${id}/enlaces`);
  return data;
}

export async function crearEnlace(
  id: string,
  body: { tipo: TipoEnlace; etiqueta: string; url: string },
): Promise<EnlaceCliente> {
  const { data } = await api.post<EnlaceCliente>(`/clientes/${id}/enlaces`, body);
  return data;
}

export async function eliminarEnlace(enlaceId: string): Promise<void> {
  await api.delete(`/enlaces-cliente/${enlaceId}`);
}

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

const ctrl = (controlToken: string) => ({ headers: { 'X-Control-Token': controlToken } });

export async function getClaves(id: string, controlToken: string): Promise<Clave[]> {
  const { data } = await api.get<Clave[]>(`/clientes/${id}/claves`, ctrl(controlToken));
  return data;
}

export async function crearClave(id: string, controlToken: string, body: ClaveInput): Promise<Clave> {
  const { data } = await api.post<Clave>(`/clientes/${id}/claves`, body, ctrl(controlToken));
  return data;
}

export async function actualizarClave(
  id: string,
  controlToken: string,
  claveId: string,
  body: ClaveInput,
): Promise<Clave> {
  const { data } = await api.patch<Clave>(`/clientes/${id}/claves/${claveId}`, body, ctrl(controlToken));
  return data;
}

export async function eliminarClave(id: string, controlToken: string, claveId: string): Promise<void> {
  await api.delete(`/clientes/${id}/claves/${claveId}`, ctrl(controlToken));
}

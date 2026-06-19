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

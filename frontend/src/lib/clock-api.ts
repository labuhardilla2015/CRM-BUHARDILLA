import { api } from './api';

export interface Fichaje {
  id: string;
  usuarioId: string;
  inicio: string;
  fin: string | null;
  editadoPorId: string | null;
  editadoAt: string | null;
  createdAt: string;
  usuario?: { id: string; nombre: string };
}

export async function getEstadoFichaje(): Promise<Fichaje | null> {
  const { data } = await api.get<Fichaje | ''>('/clock/fichajes/estado');
  return data || null;
}

export async function ficharEntrada(): Promise<Fichaje> {
  const { data } = await api.post<Fichaje>('/clock/fichajes/entrada');
  return data;
}

export async function ficharSalida(): Promise<Fichaje> {
  const { data } = await api.post<Fichaje>('/clock/fichajes/salida');
  return data;
}

export async function getHistorialFichajes(params?: {
  usuarioId?: string;
  desde?: string;
  hasta?: string;
}): Promise<Fichaje[]> {
  const { data } = await api.get<Fichaje[]>('/clock/fichajes', { params });
  return data;
}

/** Editar las marcas de un fichaje (solo admin). */
export async function editarFichaje(
  id: string,
  body: { inicio?: string; fin?: string },
): Promise<Fichaje> {
  const { data } = await api.patch<Fichaje>(`/clock/fichajes/${id}`, body);
  return data;
}

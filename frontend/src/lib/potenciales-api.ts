import { api } from './api';

export type EstadoPotencial =
  | 'NUEVO'
  | 'CONTACTADO'
  | 'PRESUPUESTO_ENVIADO'
  | 'ACEPTADO'
  | 'RECHAZADO';

export const ESTADOS_POTENCIAL: { value: EstadoPotencial; label: string }[] = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'CONTACTADO', label: 'Contactado' },
  { value: 'PRESUPUESTO_ENVIADO', label: 'Presupuesto enviado' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
];

export const ESTADO_POTENCIAL_LABEL: Record<EstadoPotencial, string> = Object.fromEntries(
  ESTADOS_POTENCIAL.map((e) => [e.value, e.label]),
) as Record<EstadoPotencial, string>;

export interface Potencial {
  id: string;
  nombre: string;
  contacto: string | null;
  origen: string | null;
  notas: string | null;
  estado: EstadoPotencial;
  clienteConvertidoId: string | null;
  createdAt: string;
  cliente?: { id: string; nombre: string } | null;
}

export interface PotencialInput {
  nombre?: string;
  contacto?: string;
  origen?: string;
  notas?: string;
  estado?: EstadoPotencial;
}

export async function getPotenciales(): Promise<Potencial[]> {
  const { data } = await api.get<Potencial[]>('/potenciales');
  return data;
}

export async function crearPotencial(body: PotencialInput): Promise<Potencial> {
  const { data } = await api.post<Potencial>('/potenciales', body);
  return data;
}

export async function actualizarPotencial(id: string, body: PotencialInput): Promise<Potencial> {
  const { data } = await api.patch<Potencial>(`/potenciales/${id}`, body);
  return data;
}

export async function eliminarPotencial(id: string): Promise<void> {
  await api.delete(`/potenciales/${id}`);
}

export async function convertirPotencial(id: string): Promise<{ id: string; nombre: string }> {
  const { data } = await api.post<{ id: string; nombre: string }>(`/potenciales/${id}/convertir`);
  return data;
}

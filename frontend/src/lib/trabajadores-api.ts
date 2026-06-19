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

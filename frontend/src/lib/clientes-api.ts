import { api } from './api';

export interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
}

export async function getClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>('/clientes');
  return data;
}

export async function crearCliente(nombre: string): Promise<Cliente> {
  const { data } = await api.post<Cliente>('/clientes', { nombre });
  return data;
}

import { api } from './api';
import { useAuth } from '@/store/auth';
import type { AuthResponse } from '@/types';

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  useAuth.getState().setSession(data.accessToken, data.usuario);
  return data.usuario;
}

export async function register(nombre: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', { nombre, email, password });
  useAuth.getState().setSession(data.accessToken, data.usuario);
  return data.usuario;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    useAuth.getState().clear();
  }
}

/** Extrae un mensaje legible de un error de axios. */
export function errorMessage(err: unknown, fallback = 'Ha ocurrido un error'): string {
  if (typeof err === 'object' && err && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string | string[] } } }).response;
    const msg = resp?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '@/store/auth';
import type { AuthResponse } from '@/types';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Instancia principal: envía cookies (refresh) y el Bearer del access token. */
export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Instancia "limpia" para el refresh, evita bucles de interceptores.
const refreshClient = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auto-refresh ante 401 ──────────────────────────────────────────────
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const { data } = await refreshClient.post<AuthResponse>('/auth/refresh');
    useAuth.getState().setSession(data.accessToken, data.usuario);
    return data.accessToken;
  } catch {
    useAuth.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      // Comparte una sola petición de refresh entre llamadas concurrentes
      refreshing ??= doRefresh().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Intenta restaurar la sesión al cargar la app (usa la cookie de refresh). */
export async function restoreSession(): Promise<boolean> {
  const token = await doRefresh();
  return token !== null;
}

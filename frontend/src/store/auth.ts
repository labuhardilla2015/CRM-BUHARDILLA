import { create } from 'zustand';
import type { Usuario } from '@/types';

interface AuthState {
  accessToken: string | null;
  usuario: Usuario | null;
  /** true mientras se intenta restaurar la sesión al cargar la app. */
  cargando: boolean;
  setSession: (accessToken: string, usuario: Usuario) => void;
  setUsuario: (usuario: Usuario | null) => void;
  setCargando: (v: boolean) => void;
  clear: () => void;
}

/**
 * El access token vive solo en memoria (no en localStorage) para reducir la
 * superficie de XSS. El refresh token viaja en una cookie httpOnly.
 */
export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  usuario: null,
  cargando: true,
  setSession: (accessToken, usuario) => set({ accessToken, usuario }),
  setUsuario: (usuario) => set({ usuario }),
  setCargando: (cargando) => set({ cargando }),
  clear: () => set({ accessToken: null, usuario: null }),
}));

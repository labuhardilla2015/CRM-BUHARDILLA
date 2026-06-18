export type Rol = 'ADMIN' | 'TRABAJADOR';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface AuthResponse {
  accessToken: string;
  usuario: Usuario;
}

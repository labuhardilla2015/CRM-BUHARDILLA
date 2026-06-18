import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import type { Rol } from '@/types';

/**
 * Protege rutas. Si se pasa `roles`, además exige que el usuario tenga uno
 * de esos roles; si no, redirige al dashboard.
 */
export function ProtectedRoute({ roles }: { roles?: Rol[] }) {
  const { accessToken, usuario, cargando } = useAuth();

  if (cargando) {
    return <div className="grid h-full place-items-center text-slate-400">Cargando…</div>;
  }

  if (!accessToken || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

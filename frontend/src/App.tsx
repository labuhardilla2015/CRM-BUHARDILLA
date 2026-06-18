import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { restoreSession } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';

export default function App() {
  const setCargando = useAuth((s) => s.setCargando);

  // Al cargar, intenta restaurar la sesión con la cookie de refresh.
  useEffect(() => {
    restoreSession().finally(() => setCargando(false));
  }, [setCargando]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

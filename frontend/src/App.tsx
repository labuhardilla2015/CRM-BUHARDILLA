import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { restoreSession } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Inicio } from '@/pages/Inicio';
import { Fichaje } from '@/pages/reloj/Fichaje';
import { Cronometro } from '@/pages/reloj/Cronometro';
import { Informes } from '@/pages/reloj/Informes';
import { ComingSoon } from '@/components/PageHeader';

export default function App() {
  const setCargando = useAuth((s) => s.setCargando);

  // Al cargar, intenta restaurar la sesión con la cookie de refresh.
  useEffect(() => {
    restoreSession().finally(() => setCargando(false));
  }, [setCargando]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Privadas dentro del layout con menú lateral */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Inicio />} />

            {/* Reloj (Fase 2) */}
            <Route path="/reloj" element={<Navigate to="/reloj/fichaje" replace />} />
            <Route path="/reloj/fichaje" element={<Fichaje />} />
            <Route path="/reloj/cronometro" element={<Cronometro />} />
            {/* Compatibilidad: el calendario ahora vive dentro del cronómetro */}
            <Route path="/reloj/calendario" element={<Navigate to="/reloj/cronometro" replace />} />
            <Route path="/reloj/informes" element={<Informes />} />

            {/* Clientes (Fase 3) */}
            <Route
              path="/clientes"
              element={<ComingSoon title="Clientes" fase="Fase 3" desc="Tableros tipo Trello, fichas y hoja de claves." />}
            />

            {/* Potenciales (Fase 4, solo admin) */}
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route
                path="/potenciales"
                element={<ComingSoon title="Potenciales" fase="Fase 4" desc="Embudo de clientes potenciales y presupuestos." />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, Users, Target, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { logout } from '@/lib/auth-api';
import { Button } from '@/components/ui';

const MODULOS = [
  { icon: Clock, nombre: 'Reloj', desc: 'Fichaje y cronómetro', fase: 'Fase 2', soloAdmin: false },
  { icon: Users, nombre: 'Clientes', desc: 'Tableros y fichas', fase: 'Fase 3', soloAdmin: false },
  { icon: Target, nombre: 'Potenciales', desc: 'Embudo y presupuestos', fase: 'Fase 4', soloAdmin: true },
];

export function Dashboard() {
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario)!;

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-brand" />
          <div>
            <h1 className="text-lg font-semibold">CRM · La Buhardilla</h1>
            <p className="text-sm text-slate-500">
              Hola, {usuario.nombre} ·{' '}
              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">
                {usuario.rol}
              </span>
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Salir
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULOS.filter((m) => !m.soloAdmin || usuario.rol === 'ADMIN').map((m) => (
          <div key={m.nombre} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <m.icon className="mb-3 h-6 w-6 text-brand" />
            <h2 className="font-medium">{m.nombre}</h2>
            <p className="text-sm text-slate-500">{m.desc}</p>
            <span className="mt-3 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              Próximamente · {m.fase}
            </span>
          </div>
        ))}
      </section>

      <p className="mt-8 text-center text-sm text-slate-400">
        Fase 1 (Auth/Roles) completada. Los módulos se irán activando por fases.
      </p>
    </div>
  );
}

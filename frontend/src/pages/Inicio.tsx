import { Link } from 'react-router-dom';
import { Clock, Users, Target } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';

const MODULOS = [
  { to: '/reloj', icon: Clock, nombre: 'Reloj', desc: 'Fichaje y cronómetro', fase: 'Fase 2', soloAdmin: false },
  { to: '/clientes', icon: Users, nombre: 'Clientes', desc: 'Tableros y fichas', fase: 'Fase 3', soloAdmin: false },
  { to: '/potenciales', icon: Target, nombre: 'Potenciales', desc: 'Embudo y presupuestos', fase: 'Fase 4', soloAdmin: true },
];

export function Inicio() {
  const usuario = useAuth((s) => s.usuario)!;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={`Hola, ${usuario.nombre}`}
        subtitle="Panel principal del CRM. Accede a los módulos desde el menú lateral."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULOS.filter((m) => !m.soloAdmin || usuario.rol === 'ADMIN').map((m) => (
          <Link
            key={m.nombre}
            to={m.to}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand/40"
          >
            <m.icon className="mb-3 h-6 w-6 text-brand" />
            <h2 className="font-medium">{m.nombre}</h2>
            <p className="text-sm text-slate-500">{m.desc}</p>
            <span className="mt-3 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {m.fase}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}

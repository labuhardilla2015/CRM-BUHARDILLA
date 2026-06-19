import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Users, Target, IdCard } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { getClientes } from '@/lib/clientes-api';
import { PageHeader } from '@/components/PageHeader';
import { ClienteLogo } from '@/components/clientes/ClienteLogo';

const MODULOS = [
  { to: '/reloj', icon: Clock, nombre: 'Reloj', desc: 'Fichaje y cronómetro', soloAdmin: false },
  { to: '/clientes', icon: Users, nombre: 'Clientes', desc: 'Tableros y fichas', soloAdmin: false },
  { to: '/potenciales', icon: Target, nombre: 'Potenciales', desc: 'Embudo y presupuestos', soloAdmin: true },
  { to: '/trabajadores', icon: IdCard, nombre: 'Trabajadores', desc: 'Fichas de empleado', soloAdmin: true },
];

export function Inicio() {
  const usuario = useAuth((s) => s.usuario)!;
  const clientes = useQuery({ queryKey: ['clientes'], queryFn: getClientes });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={`Hola, ${usuario.nombre}`}
        subtitle="Panel principal del CRM. Accede a los módulos o a tus clientes."
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULOS.filter((m) => !m.soloAdmin || usuario.rol === 'ADMIN').map((m) => (
          <Link
            key={m.nombre}
            to={m.to}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand/40"
          >
            <m.icon className="mb-3 h-6 w-6 text-brand" />
            <h2 className="font-medium">{m.nombre}</h2>
            <p className="text-sm text-slate-500">{m.desc}</p>
          </Link>
        ))}
      </section>

      {/* Acceso rápido a clientes (con su logo) */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Tus clientes</h2>
      {clientes.data?.length ? (
        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {clientes.data.map((c) => (
            <Link
              key={c.id}
              to={`/clientes?cliente=${c.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:ring-2 hover:ring-brand/30"
            >
              <ClienteLogo id={c.id} nombre={c.nombre} logoRuta={c.logoRuta} className="h-14 w-14 text-xl" />
              <span className="w-full truncate text-sm font-medium text-slate-700">{c.nombre}</span>
            </Link>
          ))}
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
          {clientes.isLoading ? 'Cargando…' : 'Aún no hay clientes.'}
        </p>
      )}
    </div>
  );
}

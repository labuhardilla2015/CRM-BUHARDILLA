import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, FileBarChart, Users2, Briefcase, AlertTriangle } from 'lucide-react';
import {
  getResumen,
  getUsuarios,
  type FiltrosInforme,
  type ItemAgrupado,
} from '@/lib/informes-api';
import { getClientes, getLimites } from '@/lib/clientes-api';
import { ACCION_LABEL } from '@/lib/registros-api';
import { ACCIONES, type AccionTiempo } from '@/lib/registros-api';
import { formatHoras, inicioHoy, inicioSemana, sumarDias } from '@/lib/tiempo';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';
import { Select } from '@/components/ui';

type Preset = 'hoy' | 'semana' | 'mes' | 'todo';

function rangoDePreset(preset: Preset): { desde?: string; hasta?: string } {
  const ahora = new Date();
  if (preset === 'hoy') {
    return { desde: inicioHoy().toISOString(), hasta: sumarDias(inicioHoy(), 1).toISOString() };
  }
  if (preset === 'semana') {
    const lunes = inicioSemana(ahora);
    return { desde: lunes.toISOString(), hasta: sumarDias(lunes, 7).toISOString() };
  }
  if (preset === 'mes') {
    const ini = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    return { desde: ini.toISOString(), hasta: fin.toISOString() };
  }
  return {};
}

export function Informes() {
  const usuario = useAuth((s) => s.usuario)!;
  const esAdmin = usuario.rol === 'ADMIN';

  const [preset, setPreset] = useState<Preset>('semana');
  const [usuarioId, setUsuarioId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [accion, setAccion] = useState<AccionTiempo | ''>('');

  const clientes = useQuery({ queryKey: ['clientes'], queryFn: getClientes });
  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: getUsuarios, enabled: esAdmin });

  const filtros = useMemo<FiltrosInforme>(() => {
    const { desde, hasta } = rangoDePreset(preset);
    return {
      desde,
      hasta,
      ...(esAdmin && usuarioId ? { usuarioId } : {}),
      ...(clienteId ? { clienteId } : {}),
      ...(accion ? { accion } : {}),
    };
  }, [preset, usuarioId, clienteId, accion, esAdmin]);

  const resumen = useQuery({
    queryKey: ['informe', filtros],
    queryFn: () => getResumen(filtros),
  });

  // Límites del cliente seleccionado (para avisar de los superados)
  const limites = useQuery({
    queryKey: ['limites', clienteId],
    queryFn: () => getLimites(clienteId),
    enabled: !!clienteId,
  });
  const excedidos = (limites.data ?? []).filter((l) => l.excedido);

  const total = resumen.data?.totalSegundos ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Informes de tiempo" subtitle="Filtra y analiza el tiempo dedicado." />

      {/* Filtros */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Periodo</label>
          <Select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="todo">Todo</option>
          </Select>
        </div>
        {esAdmin && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Persona</label>
            <Select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              <option value="">Todas</option>
              {usuarios.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Cliente</label>
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Todos</option>
            {clientes.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Acción</label>
          <Select value={accion} onChange={(e) => setAccion(e.target.value as AccionTiempo | '')}>
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Aviso de límites superados (cuando se filtra por cliente) */}
      {excedidos.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Límite mensual superado:</p>
            <ul className="mt-1 list-inside list-disc">
              {excedidos.map((l) => (
                <li key={l.accion}>{ACCION_LABEL[l.accion]}: {l.horasUsadas}h de {l.horas}h</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mb-8 flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand/10 text-brand">
          <Clock3 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Tiempo total</p>
          <p className="text-2xl font-semibold tabular-nums text-slate-900">
            {resumen.isLoading ? '…' : formatHoras(total)}
          </p>
        </div>
        <div className="ml-auto text-right text-sm text-slate-400">
          {resumen.data?.numRegistros ?? 0} registros
        </div>
      </div>

      {/* Desgloses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Por cliente" icon={Briefcase} items={resumen.data?.porCliente ?? []} total={total} />
        <Bloque titulo="Por acción" icon={FileBarChart} items={resumen.data?.porAccion ?? []} total={total} />
        {esAdmin && (
          <Bloque titulo="Por persona" icon={Users2} items={resumen.data?.porUsuario ?? []} total={total} />
        )}
      </div>
    </div>
  );
}

function Bloque({
  titulo,
  icon: Icon,
  items,
  total,
}: {
  titulo: string;
  icon: typeof Briefcase;
  items: ItemAgrupado[];
  total: number;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon className="h-4 w-4 text-brand" /> {titulo}
      </h3>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((it) => {
            const pct = total > 0 ? Math.round((it.segundos / total) * 100) : 0;
            return (
              <li key={it.clave}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{it.etiqueta}</span>
                  <span className="ml-2 tabular-nums text-slate-500">{formatHoras(it.segundos)} · {pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-slate-400">Sin datos en este periodo.</p>
      )}
    </div>
  );
}

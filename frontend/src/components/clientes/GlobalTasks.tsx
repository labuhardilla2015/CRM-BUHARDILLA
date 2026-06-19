import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';
import {
  ESTADO_LABEL,
  getTareasActivas,
  TIPO_LABEL,
  type EstadoTarjeta,
  type Tarjeta,
} from '@/lib/tableros-api';
import { getUsuarios } from '@/lib/informes-api';
import { useAuth } from '@/store/auth';
import { Select } from '@/components/ui';
import { CardModal } from './CardModal';

const ESTADO_BADGE: Record<EstadoTarjeta, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600',
  EN_CURSO: 'bg-brand/10 text-brand',
  HECHO: 'bg-emerald-100 text-emerald-700',
};

/**
 * Vista global de las tareas en curso del cliente (todas sus tarjetas
 * activas, de todos los tableros). Admin filtra por trabajador; el trabajador
 * puede ver solo las suyas.
 */
export function GlobalTasks({ clienteId }: { clienteId: string }) {
  const yo = useAuth((s) => s.usuario)!;
  const esAdmin = yo.rol === 'ADMIN';
  const [filtro, setFiltro] = useState(''); // '' = todas; '__mias' o un userId
  const [abierta, setAbierta] = useState<Tarjeta | null>(null);

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: getUsuarios, enabled: esAdmin });

  const asignadoId = filtro === '__mias' ? yo.id : filtro || undefined;
  const tareas = useQuery({
    queryKey: ['tareas-activas', clienteId, asignadoId ?? 'todas'],
    queryFn: () => getTareasActivas(clienteId, asignadoId),
  });
  // Solo las que están realmente "En curso" (no pendientes ni hechas)
  const enCurso = (tareas.data ?? []).filter((t) => t.estado === 'EN_CURSO');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ListChecks className="h-4 w-4 text-brand" /> Tareas en curso
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
            {enCurso.length}
          </span>
        </h3>

        {esAdmin ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Trabajador</span>
            <Select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="w-44">
              <option value="">Todos</option>
              {usuarios.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </Select>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filtro === '__mias'}
              onChange={(e) => setFiltro(e.target.checked ? '__mias' : '')}
              className="accent-brand"
            />
            Solo mis tareas
          </label>
        )}
      </div>

      {enCurso.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enCurso.map((t) => (
            <button
              key={t.id}
              onClick={() => setAbierta(t)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:ring-2 hover:ring-brand/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {t.tablero ? TIPO_LABEL[t.tablero.tipo] : ''}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADO_BADGE[t.estado]}`}>
                  {ESTADO_LABEL[t.estado]}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800">{t.titulo}</p>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${t.progreso}%` }} />
                </div>
                <span className="text-[10px] tabular-nums text-slate-400">{t.progreso}%</span>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {t.asignaciones?.length ? (
                  t.asignaciones.slice(0, 4).map((a) => (
                    <span
                      key={a.usuarioId}
                      title={a.usuario.nombre}
                      className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[9px] font-semibold text-white"
                    >
                      {a.usuario.nombre.charAt(0).toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-300">Sin asignar</span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-400">
          {tareas.isLoading ? 'Cargando…' : 'No hay tareas en curso con este filtro.'}
        </p>
      )}

      {abierta && <CardModal tarjeta={abierta} onClose={() => setAbierta(null)} />}
    </section>
  );
}

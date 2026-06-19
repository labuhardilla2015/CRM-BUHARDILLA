import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users2 } from 'lucide-react';
import { getHistorialFichajes } from '@/lib/clock-api';
import { getTrabajadores } from '@/lib/trabajadores-api';
import { duracionSeg, formatDuracion, formatFecha, formatHoras, formatHora, rangoPeriodo } from '@/lib/tiempo';
import { Select } from '@/components/ui';

type Periodo = 'semana' | 'mes' | 'ano';

const PERIODO_LABEL: Record<Periodo, string> = { semana: 'Esta semana', mes: 'Este mes', ano: 'Este año' };

/** Panel del admin para revisar los fichajes de un trabajador por periodo. */
export function FichajesPorTrabajador() {
  const [usuarioId, setUsuarioId] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('semana');

  const trabajadores = useQuery({ queryKey: ['trabajadores'], queryFn: getTrabajadores });
  const { desde, hasta } = rangoPeriodo(periodo);

  const fichajes = useQuery({
    queryKey: ['fichajes-admin', usuarioId, periodo],
    queryFn: () => getHistorialFichajes({ usuarioId, desde, hasta }),
    enabled: !!usuarioId,
  });

  const total = useMemo(
    () => (fichajes.data ?? []).reduce((a, f) => a + (f.fin ? duracionSeg(f.inicio, f.fin) : 0), 0),
    [fichajes.data],
  );

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Users2 className="h-4 w-4 text-brand" /> Fichajes por trabajador
      </h2>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Trabajador</label>
          <Select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">— Elegir —</option>
            {trabajadores.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Periodo</label>
          <Select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
            <option value="semana">Semanal</option>
            <option value="mes">Mensual</option>
            <option value="ano">Anual</option>
          </Select>
        </div>
        <div className="flex items-end">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            Total {PERIODO_LABEL[periodo].toLowerCase()}:{' '}
            <span className="font-semibold tabular-nums text-slate-800">{formatHoras(total)}</span>
          </div>
        </div>
      </div>

      {!usuarioId ? (
        <p className="py-6 text-center text-sm text-slate-400">Elige un trabajador para ver sus fichajes.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Día</th>
                <th className="px-4 py-2 font-medium">Entrada</th>
                <th className="px-4 py-2 font-medium">Salida</th>
                <th className="px-4 py-2 font-medium">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fichajes.data?.length ? (
                fichajes.data.map((f) => (
                  <tr key={f.id} className="text-slate-700">
                    <td className="px-4 py-2 capitalize">{formatFecha(f.inicio)}</td>
                    <td className="px-4 py-2 tabular-nums">{formatHora(f.inicio)}</td>
                    <td className="px-4 py-2 tabular-nums">{f.fin ? formatHora(f.fin) : '—'}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {f.fin ? formatDuracion(duracionSeg(f.inicio, f.fin)) : <span className="text-brand">En curso</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  {fichajes.isLoading ? 'Cargando…' : 'Sin fichajes en este periodo.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users2, Pencil, Check, X } from 'lucide-react';
import { editarFichaje, getHistorialFichajes, type Fichaje } from '@/lib/clock-api';
import { getTrabajadores } from '@/lib/trabajadores-api';
import {
  duracionSeg, formatDuracion, formatFecha, formatHoras, formatHora,
  fromLocalInput, rangoPeriodo, toLocalInput,
} from '@/lib/tiempo';
import { Input, Select } from '@/components/ui';

type Periodo = 'semana' | 'mes' | 'ano';

const PERIODO_LABEL: Record<Periodo, string> = { semana: 'Esta semana', mes: 'Este mes', ano: 'Este año' };

/** Panel del admin para revisar los fichajes de un trabajador por periodo. */
export function FichajesPorTrabajador() {
  const [usuarioId, setUsuarioId] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('semana');

  const qc = useQueryClient();
  const trabajadores = useQuery({ queryKey: ['trabajadores'], queryFn: getTrabajadores });
  const { desde, hasta } = rangoPeriodo(periodo);

  const fichajes = useQuery({
    queryKey: ['fichajes-admin', usuarioId, periodo],
    queryFn: () => getHistorialFichajes({ usuarioId, desde, hasta }),
    enabled: !!usuarioId,
  });
  const refrescar = () => qc.invalidateQueries({ queryKey: ['fichajes-admin'] });

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
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fichajes.data?.length ? (
                fichajes.data.map((f) => <FilaFichaje key={f.id} f={f} onChange={refrescar} />)
              ) : (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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

function FilaFichaje({ f, onChange }: { f: Fichaje; onChange: () => void }) {
  const [editando, setEditando] = useState(false);
  const [inicio, setInicio] = useState(toLocalInput(f.inicio));
  const [fin, setFin] = useState(f.fin ? toLocalInput(f.fin) : '');

  const guardar = useMutation({
    mutationFn: () =>
      editarFichaje(f.id, {
        inicio: fromLocalInput(inicio),
        ...(fin ? { fin: fromLocalInput(fin) } : {}),
      }),
    onSuccess: () => { setEditando(false); onChange(); },
  });

  if (editando) {
    return (
      <tr className="bg-amber-50/50 text-slate-700">
        <td className="px-4 py-2 capitalize">{formatFecha(f.inicio)}</td>
        <td className="px-2 py-1.5"><Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} /></td>
        <td className="px-2 py-1.5"><Input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} /></td>
        <td className="px-4 py-2 text-slate-400">—</td>
        <td className="whitespace-nowrap px-4 py-2">
          <button onClick={() => guardar.mutate()} className="text-emerald-600 hover:text-emerald-700" title="Guardar"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditando(false)} className="ml-2 text-slate-400 hover:text-slate-600" title="Cancelar"><X className="h-4 w-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="text-slate-700">
      <td className="px-4 py-2 capitalize">{formatFecha(f.inicio)}</td>
      <td className="px-4 py-2 tabular-nums">{formatHora(f.inicio)}</td>
      <td className="px-4 py-2 tabular-nums">{f.fin ? formatHora(f.fin) : '—'}</td>
      <td className="px-4 py-2 tabular-nums">
        {f.fin ? formatDuracion(duracionSeg(f.inicio, f.fin)) : <span className="text-brand">En curso</span>}
        {f.editadoAt && <span className="ml-1 text-xs text-amber-500" title="Editado por un admin">✎</span>}
      </td>
      <td className="px-4 py-2 text-right">
        <button onClick={() => setEditando(true)} className="text-slate-400 hover:text-brand" title="Editar horario">
          <Pencil className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

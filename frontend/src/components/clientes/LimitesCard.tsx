import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, AlertTriangle } from 'lucide-react';
import { getLimites, setLimite, type LimiteUso } from '@/lib/clientes-api';
import { ACCIONES, type AccionTiempo } from '@/lib/registros-api';
import { Input } from '@/components/ui';

/** Configura los límites de horas/mes por acción y muestra el uso del mes. */
export function LimitesCard({ clienteId }: { clienteId: string }) {
  const qc = useQueryClient();
  const limites = useQuery({ queryKey: ['limites', clienteId], queryFn: () => getLimites(clienteId) });

  const porAccion = useMemo(() => {
    const m = new Map<AccionTiempo, LimiteUso>();
    for (const l of limites.data ?? []) m.set(l.accion, l);
    return m;
  }, [limites.data]);

  const guardar = useMutation({
    mutationFn: ({ accion, horas }: { accion: AccionTiempo; horas: number }) => setLimite(clienteId, accion, horas),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['limites', clienteId] }),
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Gauge className="h-4 w-4 text-brand" /> Límites de horas mensuales
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Horas/mes por acción. 0 = sin límite. Al superarse solo avisa (no detiene el cronómetro).
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {ACCIONES.map((a) => {
          const uso = porAccion.get(a.value);
          return (
            <FilaLimite
              key={a.value}
              label={a.label}
              uso={uso}
              onSet={(horas) => guardar.mutate({ accion: a.value, horas })}
            />
          );
        })}
      </div>
    </section>
  );
}

function FilaLimite({
  label, uso, onSet,
}: {
  label: string; uso?: LimiteUso; onSet: (horas: number) => void;
}) {
  const [valor, setValor] = useState(uso ? String(uso.horas) : '');
  const pct = uso && uso.horas > 0 ? Math.min(100, Math.round((uso.horasUsadas / uso.horas) * 100)) : 0;

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number" min="0" step="0.5" value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => onSet(Number(valor) || 0)}
            className="w-20 text-right"
            placeholder="—"
          />
          <span className="text-xs text-slate-400">h/mes</span>
        </div>
      </div>
      {uso && uso.horas > 0 && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className={uso.excedido ? 'font-medium text-red-600' : 'text-slate-500'}>
              {uso.excedido && <AlertTriangle className="mr-1 inline h-3 w-3" />}
              {uso.horasUsadas}h usadas de {uso.horas}h
            </span>
            <span className="text-slate-400">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${uso.excedido ? 'bg-red-500' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

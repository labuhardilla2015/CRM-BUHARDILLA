import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid } from 'lucide-react';
import {
  getTableros,
  TIPOS_TABLERO,
  TIPO_LABEL,
  type TipoTablero,
} from '@/lib/tableros-api';
import { Select } from '@/components/ui';
import { TrelloBoard } from './TrelloBoard';

/**
 * Panel de tableros del cliente. Muestra los tableros con tareas activas y
 * permite abrir/crear cualquiera de los tipos disponibles.
 */
export function BoardPanel({ clienteId }: { clienteId: string }) {
  const tableros = useQuery({ queryKey: ['tableros', clienteId], queryFn: () => getTableros(clienteId) });
  const [tipo, setTipo] = useState<TipoTablero | ''>('');

  // Selecciona el primer tablero activo cuando llegan los datos
  useEffect(() => {
    if (!tipo && tableros.data && tableros.data.length > 0) {
      setTipo(tableros.data[0].tipo);
    }
  }, [tableros.data, tipo]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <LayoutGrid className="h-4 w-4 text-brand" /> Tableros
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Abrir / crear</span>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoTablero)} className="w-44">
            <option value="">— Tablero —</option>
            {TIPOS_TABLERO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Chips de tableros con tareas activas */}
      {tableros.data && tableros.data.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {tableros.data.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.tipo)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tipo === t.tipo
                  ? 'bg-brand text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {TIPO_LABEL[t.tipo]} · {t.activas}
            </button>
          ))}
        </div>
      )}

      {tipo ? (
        <div>
          <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Tablero · {TIPO_LABEL[tipo]}</p>
          <TrelloBoard clienteId={clienteId} tipo={tipo} />
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-400">
          Selecciona un tablero arriba para ver o crear tarjetas.
        </p>
      )}
    </section>
  );
}

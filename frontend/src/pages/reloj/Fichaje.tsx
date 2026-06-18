import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Pencil } from 'lucide-react';
import {
  ficharEntrada,
  ficharSalida,
  getEstadoFichaje,
  getHistorialFichajes,
  type Fichaje as TFichaje,
} from '@/lib/clock-api';
import { errorMessage } from '@/lib/auth-api';
import { duracionSeg, formatDuracion, formatFecha, formatHora } from '@/lib/tiempo';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';

export function Fichaje() {
  const qc = useQueryClient();
  const usuario = useAuth((s) => s.usuario)!;
  const esAdmin = usuario.rol === 'ADMIN';
  const [error, setError] = useState('');

  const estado = useQuery({ queryKey: ['fichaje-estado'], queryFn: getEstadoFichaje });
  const historial = useQuery({ queryKey: ['fichaje-historial'], queryFn: getHistorialFichajes });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['fichaje-estado'] });
    qc.invalidateQueries({ queryKey: ['fichaje-historial'] });
  };

  const entrada = useMutation({
    mutationFn: ficharEntrada,
    onSuccess: refrescar,
    onError: (e) => setError(errorMessage(e)),
  });
  const salida = useMutation({
    mutationFn: ficharSalida,
    onSuccess: refrescar,
    onError: (e) => setError(errorMessage(e)),
  });

  const abierto = estado.data;
  const ocupado = entrada.isPending || salida.isPending;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Fichaje de jornada" subtitle="Marca tu entrada y salida del día." />

      {/* Tarjeta de estado + cronómetro */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-500">
              {abierto ? 'Jornada en curso' : 'Sin jornada activa'}
            </p>
            {abierto ? (
              <RelojEnVivo inicio={abierto.inicio} />
            ) : (
              <p className="text-3xl font-semibold tabular-nums text-slate-300">00:00:00</p>
            )}
            {abierto && (
              <p className="mt-1 text-xs text-slate-400">Entrada: {formatHora(abierto.inicio)}</p>
            )}
          </div>

          {abierto ? (
            <Button
              onClick={() => { setError(''); salida.mutate(); }}
              disabled={ocupado}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" /> Marcar salida
            </Button>
          ) : (
            <Button onClick={() => { setError(''); entrada.mutate(); }} disabled={ocupado}>
              <LogIn className="mr-2 h-4 w-4" /> Marcar entrada
            </Button>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {/* Historial */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Historial reciente</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {esAdmin && <th className="px-4 py-2 font-medium">Trabajador</th>}
              <th className="px-4 py-2 font-medium">Día</th>
              <th className="px-4 py-2 font-medium">Entrada</th>
              <th className="px-4 py-2 font-medium">Salida</th>
              <th className="px-4 py-2 font-medium">Duración</th>
              {esAdmin && <th className="px-4 py-2 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historial.data?.length ? (
              historial.data.map((f) => (
                <FilaFichaje key={f.id} f={f} esAdmin={esAdmin} />
              ))
            ) : (
              <tr>
                <td colSpan={esAdmin ? 6 : 4} className="px-4 py-8 text-center text-slate-400">
                  {historial.isLoading ? 'Cargando…' : 'Aún no hay fichajes registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Cronómetro que avanza en tiempo real mientras la jornada está abierta. */
function RelojEnVivo({ inicio }: { inicio: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-3xl font-semibold tabular-nums text-brand">
      {formatDuracion(duracionSeg(inicio))}
    </p>
  );
}

function FilaFichaje({ f, esAdmin }: { f: TFichaje; esAdmin: boolean }) {
  return (
    <tr className="text-slate-700">
      {esAdmin && <td className="px-4 py-2.5">{f.usuario?.nombre ?? '—'}</td>}
      <td className="px-4 py-2.5 capitalize">{formatFecha(f.inicio)}</td>
      <td className="px-4 py-2.5 tabular-nums">{formatHora(f.inicio)}</td>
      <td className="px-4 py-2.5 tabular-nums">{f.fin ? formatHora(f.fin) : '—'}</td>
      <td className="px-4 py-2.5 tabular-nums">
        {f.fin ? formatDuracion(duracionSeg(f.inicio, f.fin)) : <span className="text-brand">En curso</span>}
        {f.editadoAt && <span className="ml-1 text-xs text-amber-500" title="Editado por un admin">✎</span>}
      </td>
      {esAdmin && (
        <td className="px-4 py-2.5 text-right">
          <button className="text-slate-400 hover:text-brand" title="Editar (próximamente)" disabled>
            <Pencil className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Clock, CheckCircle2 } from 'lucide-react';
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
import { FichajesPorTrabajador } from '@/components/reloj/FichajesPorTrabajador';

const MAX_DIA = 2;

function esHoy(iso: string): boolean {
  const d = new Date(iso);
  const h = new Date();
  return d.toDateString() === h.toDateString();
}

export function Fichaje() {
  const qc = useQueryClient();
  const usuario = useAuth((s) => s.usuario)!;
  const esAdmin = usuario.rol === 'ADMIN';
  const [error, setError] = useState('');

  const estado = useQuery({ queryKey: ['fichaje-estado'], queryFn: getEstadoFichaje });
  const historial = useQuery({ queryKey: ['fichaje-historial'], queryFn: () => getHistorialFichajes() });

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

  // Fichajes de HOY del propio usuario (para los 2 turnos)
  const fichajesHoy = useMemo(() => {
    const propios = (historial.data ?? []).filter((f) => f.usuarioId === usuario.id && esHoy(f.inicio));
    return propios.sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio));
  }, [historial.data, usuario.id]);

  const totalHoy = useMemo(
    () => fichajesHoy.reduce((acc, f) => acc + (f.fin ? duracionSeg(f.inicio, f.fin) : 0), 0),
    [fichajesHoy],
  );

  const ocupado = entrada.isPending || salida.isPending;
  const limiteAlcanzado = fichajesHoy.length >= MAX_DIA && !abierto;

  // Construye los 2 huecos del día
  const slots: (TFichaje | null)[] = [fichajesHoy[0] ?? null, fichajesHoy[1] ?? null];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Fichaje de jornada" subtitle="Marca tu entrada y salida (máximo 2 al día)." />

      {/* HERO: estado + cronómetro grande */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-sidebar text-white shadow-sm">
        <div className="flex flex-col items-center gap-5 px-6 py-10 text-center">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            {abierto ? 'Jornada en curso' : limiteAlcanzado ? 'Jornada finalizada' : 'Sin jornada activa'}
          </div>

          {abierto ? (
            <RelojEnVivo inicio={abierto.inicio} />
          ) : (
            <p className="text-5xl font-bold tabular-nums text-white/30">00:00:00</p>
          )}

          {abierto && <p className="text-xs text-slate-400">Entrada a las {formatHora(abierto.inicio)}</p>}

          {abierto ? (
            <Button
              onClick={() => { setError(''); salida.mutate(); }}
              disabled={ocupado}
              className="bg-brand px-6 py-2.5 text-base hover:bg-brand-dark"
            >
              <LogOut className="mr-2 h-5 w-5" /> Marcar salida
            </Button>
          ) : (
            <Button
              onClick={() => { setError(''); entrada.mutate(); }}
              disabled={ocupado || limiteAlcanzado}
              className="bg-brand px-6 py-2.5 text-base hover:bg-brand-dark"
            >
              <LogIn className="mr-2 h-5 w-5" /> Marcar entrada
            </Button>
          )}

          {limiteAlcanzado && (
            <p className="text-xs text-slate-400">Has completado tus 2 fichajes de hoy.</p>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </div>

      {/* Resumen de HOY: 2 turnos + total */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {slots.map((f, i) => (
          <SlotTurno key={i} indice={i} fichaje={f} />
        ))}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-400">Total de hoy</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
            {formatDuracion(totalHoy)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{fichajesHoy.length}/{MAX_DIA} fichajes</p>
        </div>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historial.data?.length ? (
              historial.data.map((f) => <FilaFichaje key={f.id} f={f} esAdmin={esAdmin} />)
            ) : (
              <tr>
                <td colSpan={esAdmin ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                  {historial.isLoading ? 'Cargando…' : 'Aún no hay fichajes registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Filtro de fichajes por trabajador y periodo (solo admin) */}
      {esAdmin && <FichajesPorTrabajador />}
    </div>
  );
}

function SlotTurno({ indice, fichaje }: { indice: number; fichaje: TFichaje | null }) {
  const etiqueta = indice === 0 ? '1.er turno' : '2.º turno';

  if (!fichaje) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">{etiqueta}</p>
          <p className="mt-2 text-sm text-slate-300">Sin registrar</p>
        </div>
      </div>
    );
  }

  const enCurso = !fichaje.fin;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-slate-400">{etiqueta}</p>
        {enCurso ? (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
            En curso
          </span>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="rounded bg-slate-100 px-2 py-1 tabular-nums">{formatHora(fichaje.inicio)}</span>
        <span className="text-slate-300">→</span>
        <span className="rounded bg-slate-100 px-2 py-1 tabular-nums">
          {fichaje.fin ? formatHora(fichaje.fin) : '—'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {fichaje.fin ? formatDuracion(duracionSeg(fichaje.inicio, fichaje.fin)) : 'Trabajando…'}
      </p>
    </div>
  );
}

function RelojEnVivo({ inicio }: { inicio: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p className="text-5xl font-bold tabular-nums text-white">{formatDuracion(duracionSeg(inicio))}</p>;
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
    </tr>
  );
}

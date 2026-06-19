import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ACCION_COLOR,
  ACCION_LABEL,
  getRegistros,
  type RegistroTiempo,
} from '@/lib/registros-api';
import { duracionSeg, formatDuracion, inicioSemana, sumarDias } from '@/lib/tiempo';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';

const HORA_INICIO = 7; // primera hora visible
const HORA_FIN = 22; // última hora visible
const ALTO_HORA = 48; // px por hora
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function Calendario() {
  const usuario = useAuth((s) => s.usuario)!;
  const [refSemana, setRefSemana] = useState(() => inicioSemana(new Date()));

  const lunes = refSemana;
  const finSemana = sumarDias(lunes, 7);

  const registros = useQuery({
    queryKey: ['registros-semana', lunes.toISOString()],
    queryFn: () => getRegistros(lunes.toISOString(), finSemana.toISOString(), usuario.id),
  });

  const horas = useMemo(
    () => Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i),
    [],
  );

  // Agrupa registros por día de la semana (0 = lunes)
  const porDia = useMemo(() => {
    const map: RegistroTiempo[][] = Array.from({ length: 7 }, () => []);
    for (const r of registros.data ?? []) {
      const d = new Date(r.inicio);
      const idx = (d.getDay() + 6) % 7;
      map[idx].push(r);
    }
    return map;
  }, [registros.data]);

  const totalSemana = useMemo(
    () => (registros.data ?? []).reduce((a, r) => a + (r.fin ? duracionSeg(r.inicio, r.fin) : 0), 0),
    [registros.data],
  );

  const hoyIdx = (() => {
    const diff = Math.floor((Date.now() - lunes.getTime()) / 86400000);
    return diff >= 0 && diff < 7 ? diff : -1;
  })();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Calendario semanal" subtitle="Tus tareas registradas, por horas." />
        <div className="flex items-center gap-2">
          <span className="mr-2 text-sm text-slate-500">
            Total semana: <span className="font-semibold text-slate-800">{formatDuracion(totalSemana)}</span>
          </span>
          <Button variant="ghost" onClick={() => setRefSemana(sumarDias(lunes, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => setRefSemana(inicioSemana(new Date()))}>
            Hoy
          </Button>
          <Button variant="ghost" onClick={() => setRefSemana(sumarDias(lunes, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {/* Cabecera de días */}
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div />
          {DIAS.map((dia, i) => {
            const fecha = sumarDias(lunes, i);
            const esHoy = i === hoyIdx;
            return (
              <div key={dia} className={`px-2 py-2 text-center text-xs ${esHoy ? 'bg-brand/5' : ''}`}>
                <span className="font-medium text-slate-600">{dia}</span>{' '}
                <span className={esHoy ? 'font-bold text-brand' : 'text-slate-400'}>{fecha.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Rejilla horaria */}
        <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          {/* Columna de horas */}
          <div>
            {horas.map((h) => (
              <div key={h} className="relative text-right" style={{ height: ALTO_HORA }}>
                <span className="absolute -top-2 right-1 text-[10px] text-slate-400">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {porDia.map((regs, i) => (
            <div
              key={i}
              className={`relative border-l border-slate-100 ${i === hoyIdx ? 'bg-brand/5' : ''}`}
              style={{ height: ALTO_HORA * horas.length }}
            >
              {/* Líneas de hora */}
              {horas.map((h) => (
                <div key={h} className="border-b border-slate-100" style={{ height: ALTO_HORA }} />
              ))}
              {/* Eventos */}
              {regs.map((r) => (
                <EventoCalendario key={r.id} r={r} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventoCalendario({ r }: { r: RegistroTiempo }) {
  const inicio = new Date(r.inicio);
  const fin = r.fin ? new Date(r.fin) : new Date();

  const minInicio = inicio.getHours() * 60 + inicio.getMinutes();
  const minFin = fin.getHours() * 60 + fin.getMinutes();
  const top = ((minInicio - HORA_INICIO * 60) / 60) * ALTO_HORA;
  const alto = Math.max(16, ((minFin - minInicio) / 60) * ALTO_HORA);

  // Fuera del rango visible
  if (minFin <= HORA_INICIO * 60 || minInicio >= HORA_FIN * 60) return null;

  const color = ACCION_COLOR[r.accion];
  return (
    <div
      className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-1 text-[10px] leading-tight ${color.bg} ${color.text}`}
      style={{ top: Math.max(0, top), height: alto }}
      title={`${r.cliente?.nombre} · ${ACCION_LABEL[r.accion]}${r.descripcion ? ` · ${r.descripcion}` : ''}`}
    >
      <p className="truncate font-semibold">{r.cliente?.nombre}</p>
      <p className="truncate">{ACCION_LABEL[r.accion]}</p>
    </div>
  );
}

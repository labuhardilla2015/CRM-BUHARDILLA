import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import {
  ACCIONES,
  ACCION_LABEL,
  actualizarRegistro,
  eliminarRegistro,
  getCorriendo,
  getRegistros,
  startRegistro,
  stopRegistro,
  type AccionTiempo,
  type RegistroTiempo,
} from '@/lib/registros-api';
import { getClientes, crearCliente, getLimites } from '@/lib/clientes-api';
import { errorMessage } from '@/lib/auth-api';
import {
  duracionSeg,
  formatDuracion,
  formatHora,
  fromLocalInput,
  inicioHoy,
  sumarDias,
  toLocalInput,
} from '@/lib/tiempo';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Select } from '@/components/ui';
import { WeekCalendar } from '@/components/reloj/WeekCalendar';

export function Cronometro() {
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const clientes = useQuery({ queryKey: ['clientes'], queryFn: getClientes });
  const corriendo = useQuery({ queryKey: ['registro-corriendo'], queryFn: getCorriendo });

  // Registros de hoy
  const desde = inicioHoy().toISOString();
  const hasta = sumarDias(inicioHoy(), 1).toISOString();
  const registrosHoy = useQuery({
    queryKey: ['registros', desde],
    queryFn: () => getRegistros(desde, hasta),
  });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['registro-corriendo'] });
    qc.invalidateQueries({ queryKey: ['registros'] });
    qc.invalidateQueries({ queryKey: ['registros-semana'] });
  };

  // Formulario de arranque
  const [clienteId, setClienteId] = useState('');
  const [accion, setAccion] = useState<AccionTiempo>('SEO');
  const [descripcion, setDescripcion] = useState('');

  const start = useMutation({
    mutationFn: startRegistro,
    onSuccess: () => { setDescripcion(''); refrescar(); },
    onError: (e) => setError(errorMessage(e)),
  });
  const stop = useMutation({
    mutationFn: stopRegistro,
    onSuccess: refrescar,
    onError: (e) => setError(errorMessage(e)),
  });

  const activo = corriendo.data;
  const totalHoy = useMemo(
    () => (registrosHoy.data ?? []).reduce((acc, r) => acc + (r.fin ? duracionSeg(r.inicio, r.fin) : 0), 0),
    [registrosHoy.data],
  );

  function onStart() {
    setError('');
    if (!clienteId) { setError('Selecciona un cliente'); return; }
    start.mutate({ clienteId, accion, descripcion: descripcion || undefined });
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Cronómetro" subtitle="Mide el tiempo dedicado a cada cliente y acción." />

      {/* Banda del cronómetro */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {activo ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {activo.cliente?.nombre} · <span className="text-brand">{ACCION_LABEL[activo.accion]}</span>
              </p>
              {activo.descripcion && <p className="text-sm text-slate-500">{activo.descripcion}</p>}
              <p className="text-xs text-slate-400">Inicio {formatHora(activo.inicio)}</p>
            </div>
            <div className="flex items-center gap-4">
              <RelojEnVivo inicio={activo.inicio} />
              <Button onClick={() => stop.mutate()} disabled={stop.isPending} className="bg-red-600 hover:bg-red-700">
                <Square className="mr-2 h-4 w-4" /> Parar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Cliente</label>
              <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">— Elegir —</option>
                {clientes.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Acción</label>
              <Select value={accion} onChange={(e) => setAccion(e.target.value as AccionTiempo)}>
                {ACCIONES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Descripción (opcional)</label>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿En qué trabajas?" />
            </div>
            <Button onClick={onStart} disabled={start.isPending}>
              <Play className="mr-2 h-4 w-4" /> Iniciar
            </Button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Aviso de límites de horas superados del cliente */}
      <AvisoLimites clienteId={activo?.clienteId ?? clienteId} />

      {/* Añadir cliente */}
      <AnadirCliente
        onCreado={() => qc.invalidateQueries({ queryKey: ['clientes'] })}
        crear={crearCliente}
      />

      {/* Registros de hoy */}
      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Hoy</h2>
        <span className="text-sm text-slate-500">
          Total: <span className="font-semibold tabular-nums text-slate-800">{formatDuracion(totalHoy)}</span>
        </span>
      </div>
      <div className="space-y-2">
        {registrosHoy.data?.length ? (
          registrosHoy.data.map((r) => (
            <RegistroRow key={r.id} r={r} clientes={clientes.data ?? []} onChange={refrescar} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
            {registrosHoy.isLoading ? 'Cargando…' : 'Aún no has registrado tiempo hoy.'}
          </p>
        )}
      </div>

      {/* Calendario semanal: refleja en vivo lo que se va registrando */}
      <div className="mt-10">
        <WeekCalendar />
      </div>
    </div>
  );
}

function RelojEnVivo({ inicio }: { inicio: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p className="text-2xl font-semibold tabular-nums text-brand">{formatDuracion(duracionSeg(inicio))}</p>;
}

function AnadirCliente({
  crear,
  onCreado,
}: {
  crear: (nombre: string) => Promise<unknown>;
  onCreado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => crear(nombre.trim()),
    onSuccess: () => { setNombre(''); setAbierto(false); onCreado(); },
    onError: (e) => setErr(errorMessage(e)),
  });

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="flex items-center gap-1 text-sm text-brand hover:underline">
        <Plus className="h-4 w-4" /> Añadir cliente
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={nombre}
        onChange={(e) => { setNombre(e.target.value); setErr(''); }}
        placeholder="Nombre del cliente"
        className="max-w-xs"
      />
      <Button onClick={() => nombre.trim() && m.mutate()} disabled={m.isPending}>Guardar</Button>
      <Button variant="ghost" onClick={() => { setAbierto(false); setErr(''); }}>Cancelar</Button>
      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  );
}

function RegistroRow({
  r,
  clientes,
  onChange,
}: {
  r: RegistroTiempo;
  clientes: { id: string; nombre: string }[];
  onChange: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [clienteId, setClienteId] = useState(r.clienteId);
  const [accion, setAccion] = useState<AccionTiempo>(r.accion);
  const [descripcion, setDescripcion] = useState(r.descripcion ?? '');
  const [inicio, setInicio] = useState(toLocalInput(r.inicio));
  const [fin, setFin] = useState(r.fin ? toLocalInput(r.fin) : '');

  const guardar = useMutation({
    mutationFn: () =>
      actualizarRegistro(r.id, {
        clienteId,
        accion,
        descripcion: descripcion || undefined,
        inicio: fromLocalInput(inicio),
        ...(fin ? { fin: fromLocalInput(fin) } : {}),
      }),
    onSuccess: () => { setEditando(false); onChange(); },
  });
  const borrar = useMutation({ mutationFn: () => eliminarRegistro(r.id), onSuccess: onChange });

  if (editando) {
    return (
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-brand/30">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          <Select value={accion} onChange={(e) => setAccion(e.target.value as AccionTiempo)}>
            {ACCIONES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
          <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          <Input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
        </div>
        <Input
          className="mt-2"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción"
        />
        <div className="mt-2 flex gap-2">
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            <Check className="mr-1 h-4 w-4" /> Guardar
          </Button>
          <Button variant="ghost" onClick={() => setEditando(false)}>
            <X className="mr-1 h-4 w-4" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {r.cliente?.nombre} · <span className="text-brand">{ACCION_LABEL[r.accion]}</span>
        </p>
        <p className="truncate text-xs text-slate-400">
          {formatHora(r.inicio)}–{r.fin ? formatHora(r.fin) : '…'}
          {r.descripcion ? ` · ${r.descripcion}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums text-sm font-semibold text-slate-700">
          {r.fin ? formatDuracion(duracionSeg(r.inicio, r.fin)) : <span className="text-brand">en curso</span>}
        </span>
        <button onClick={() => setEditando(true)} className="text-slate-400 hover:text-brand" title="Editar">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => borrar.mutate()} className="text-slate-400 hover:text-red-600" title="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AvisoLimites({ clienteId }: { clienteId: string }) {
  const limites = useQuery({
    queryKey: ['limites', clienteId],
    queryFn: () => getLimites(clienteId),
    enabled: !!clienteId,
  });
  const excedidos = (limites.data ?? []).filter((l) => l.excedido);
  if (excedidos.length === 0) return null;

  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Límite de horas mensual superado en este cliente:</p>
        <ul className="mt-1 list-inside list-disc">
          {excedidos.map((l) => (
            <li key={l.accion}>{ACCION_LABEL[l.accion]}: {l.horasUsadas}h de {l.horas}h</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import {
  actualizarTarjeta,
  crearTarjeta,
  ESTADOS,
  getTarjetas,
  type EstadoTarjeta,
  type Tarjeta,
  type TipoTablero,
} from '@/lib/tableros-api';
import { formatDiaMes } from '@/lib/tiempo';
import { Button, Input } from '@/components/ui';
import { CardModal } from './CardModal';

const COL_COLOR: Record<EstadoTarjeta, string> = {
  PENDIENTE: 'border-slate-300',
  EN_CURSO: 'border-brand',
  HECHO: 'border-emerald-400',
};

export function TrelloBoard({ clienteId, tipo }: { clienteId: string; tipo: TipoTablero }) {
  const qc = useQueryClient();
  const [abierta, setAbierta] = useState<Tarjeta | null>(null);

  const tarjetas = useQuery({
    queryKey: ['tarjetas', clienteId, tipo],
    queryFn: () => getTarjetas(clienteId, tipo),
  });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['tarjetas'] });
    qc.invalidateQueries({ queryKey: ['tableros'] });
  };

  const mover = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoTarjeta }) =>
      actualizarTarjeta(id, { estado }),
    onSuccess: refrescar,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const porEstado = useMemo(() => {
    const map: Record<EstadoTarjeta, Tarjeta[]> = { PENDIENTE: [], EN_CURSO: [], HECHO: [] };
    for (const t of tarjetas.data ?? []) map[t.estado].push(t);
    return map;
  }, [tarjetas.data]);

  function onDragEnd(e: DragEndEvent) {
    const id = e.active.id as string;
    const destino = e.over?.id as EstadoTarjeta | undefined;
    if (!destino) return;
    const actual = (tarjetas.data ?? []).find((t) => t.id === id);
    if (actual && actual.estado !== destino) mover.mutate({ id, estado: destino });
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {ESTADOS.map((col) => (
            <Columna
              key={col.value}
              estado={col.value}
              titulo={col.label}
              tarjetas={porEstado[col.value]}
              clienteId={clienteId}
              tipo={tipo}
              onAbrir={setAbierta}
              onCreada={refrescar}
            />
          ))}
        </div>
      </DndContext>
      {abierta && <CardModal tarjeta={abierta} onClose={() => setAbierta(null)} />}
    </>
  );
}

function Columna({
  estado,
  titulo,
  tarjetas,
  clienteId,
  tipo,
  onAbrir,
  onCreada,
}: {
  estado: EstadoTarjeta;
  titulo: string;
  tarjetas: Tarjeta[];
  clienteId: string;
  tipo: TipoTablero;
  onAbrir: (t: Tarjeta) => void;
  onCreada: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-t-2 bg-slate-50 p-3 ${COL_COLOR[estado]} ${isOver ? 'ring-2 ring-brand/30' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold text-slate-700">{titulo}</h4>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{tarjetas.length}</span>
      </div>
      <div className="space-y-2">
        {tarjetas.map((t) => (
          <TarjetaCard key={t.id} tarjeta={t} onAbrir={onAbrir} />
        ))}
      </div>
      <NuevaTarjeta clienteId={clienteId} tipo={tipo} estado={estado} onCreada={onCreada} />
    </div>
  );
}

function TarjetaCard({ tarjeta, onAbrir }: { tarjeta: Tarjeta; onAbrir: (t: Tarjeta) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarjeta.id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onAbrir(tarjeta)}
      className="cursor-grab rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 hover:ring-brand/40 active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-slate-800">{tarjeta.titulo}</p>
      {(tarjeta.fechaInicio || tarjeta.fechaFin) && (
        <p className="mt-1 text-xs text-slate-400">
          {tarjeta.fechaInicio ? formatDiaMes(tarjeta.fechaInicio) : '—'}
          {' → '}
          {tarjeta.fechaFin ? formatDiaMes(tarjeta.fechaFin) : '—'}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand" style={{ width: `${tarjeta.progreso}%` }} />
        </div>
        <span className="text-[10px] tabular-nums text-slate-400">{tarjeta.progreso}%</span>
      </div>
    </div>
  );
}

function NuevaTarjeta({
  clienteId,
  tipo,
  estado,
  onCreada,
}: {
  clienteId: string;
  tipo: TipoTablero;
  estado: EstadoTarjeta;
  onCreada: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const crear = useMutation({
    mutationFn: () => crearTarjeta(clienteId, { tipo, titulo: titulo.trim(), estado }),
    onSuccess: () => { setTitulo(''); setAbierto(false); onCreada(); },
  });

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-white hover:text-brand"
      >
        <Plus className="h-4 w-4" /> Añadir tarjeta
      </button>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      <Input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && titulo.trim() && crear.mutate()}
        placeholder="Título de la tarjeta"
      />
      <div className="flex gap-2">
        <Button onClick={() => titulo.trim() && crear.mutate()} disabled={crear.isPending}>Añadir</Button>
        <Button variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, Mail, Tag } from 'lucide-react';
import {
  actualizarPotencial, crearPotencial, ESTADOS_POTENCIAL, getPotenciales,
  type EstadoPotencial, type Potencial,
} from '@/lib/potenciales-api';
import { errorMessage } from '@/lib/auth-api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input } from '@/components/ui';
import { PotencialModal } from '@/components/potenciales/PotencialModal';

const COL_COLOR: Record<EstadoPotencial, string> = {
  NUEVO: 'border-slate-300',
  CONTACTADO: 'border-sky-400',
  PRESUPUESTO_ENVIADO: 'border-amber-400',
  ACEPTADO: 'border-emerald-400',
  RECHAZADO: 'border-red-300',
};

export function Potenciales() {
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState<Potencial | null>(null);
  const potenciales = useQuery({ queryKey: ['potenciales'], queryFn: getPotenciales });

  const refrescar = () => qc.invalidateQueries({ queryKey: ['potenciales'] });

  const mover = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPotencial }) => actualizarPotencial(id, { estado }),
    onSuccess: refrescar,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const porEstado = useMemo(() => {
    const map = Object.fromEntries(ESTADOS_POTENCIAL.map((e) => [e.value, [] as Potencial[]])) as Record<EstadoPotencial, Potencial[]>;
    for (const p of potenciales.data ?? []) map[p.estado].push(p);
    return map;
  }, [potenciales.data]);

  function onDragEnd(e: DragEndEvent) {
    const id = e.active.id as string;
    const destino = e.over?.id as EstadoPotencial | undefined;
    if (!destino) return;
    const actual = (potenciales.data ?? []).find((p) => p.id === id);
    if (actual && actual.estado !== destino) mover.mutate({ id, estado: destino });
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Potenciales" subtitle="Embudo de clientes potenciales. Arrastra para cambiar de fase." />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {ESTADOS_POTENCIAL.map((col) => (
            <Columna
              key={col.value}
              estado={col.value}
              titulo={col.label}
              items={porEstado[col.value]}
              onAbrir={setAbierto}
              onCreado={refrescar}
            />
          ))}
        </div>
      </DndContext>

      {abierto && <PotencialModal potencial={abierto} onClose={() => setAbierto(null)} />}
    </div>
  );
}

function Columna({
  estado, titulo, items, onAbrir, onCreado,
}: {
  estado: EstadoPotencial; titulo: string; items: Potencial[];
  onAbrir: (p: Potencial) => void; onCreado: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  return (
    <div ref={setNodeRef} className={`rounded-xl border-t-2 bg-slate-50 p-3 ${COL_COLOR[estado]} ${isOver ? 'ring-2 ring-brand/30' : ''}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{titulo}</h4>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((p) => <PotencialCard key={p.id} potencial={p} onAbrir={onAbrir} />)}
      </div>
      {estado === 'NUEVO' && <NuevoPotencial onCreado={onCreado} />}
    </div>
  );
}

function PotencialCard({ potencial, onAbrir }: { potencial: Potencial; onAbrir: (p: Potencial) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: potencial.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 } : undefined;

  return (
    <div
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      onClick={() => onAbrir(potencial)}
      className="cursor-grab rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 hover:ring-brand/40 active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-slate-800">{potencial.nombre}</p>
      {potencial.contacto && (
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Mail className="h-3 w-3" />{potencial.contacto}</p>
      )}
      {potencial.origen && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Tag className="h-3 w-3" />{potencial.origen}</p>
      )}
      {potencial.clienteConvertidoId && (
        <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          ✓ Cliente
        </span>
      )}
    </div>
  );
}

function NuevoPotencial({ onCreado }: { onCreado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [origen, setOrigen] = useState('');
  const [error, setError] = useState('');

  const crear = useMutation({
    mutationFn: () => crearPotencial({ nombre: nombre.trim(), contacto: contacto || undefined, origen: origen || undefined }),
    onSuccess: () => { setNombre(''); setContacto(''); setOrigen(''); setAbierto(false); onCreado(); },
    onError: (e) => setError(errorMessage(e)),
  });

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="mt-2 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-white hover:text-brand">
        <Plus className="h-4 w-4" /> Añadir potencial
      </button>
    );
  }
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-white p-2 ring-1 ring-slate-200">
      <Input autoFocus value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }} placeholder="Nombre" />
      <Input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Contacto (email/tel)" />
      <Input value={origen} onChange={(e) => setOrigen(e.target.value)} placeholder="Origen" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => nombre.trim() && crear.mutate()} disabled={crear.isPending}>Crear</Button>
        <Button variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
      </div>
    </div>
  );
}

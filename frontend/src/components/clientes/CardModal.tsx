import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Save, X } from 'lucide-react';
import {
  actualizarTarjeta,
  eliminarTarjeta,
  ESTADOS,
  type EstadoTarjeta,
  type Tarjeta,
} from '@/lib/tableros-api';
import { fromDateInput, toDateInput } from '@/lib/tiempo';
import { Button, Input, Select } from '@/components/ui';

/** Modal de edición de una tarjeta (campos básicos de la Fase 3.2). */
export function CardModal({ tarjeta, onClose }: { tarjeta: Tarjeta; onClose: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState(tarjeta.titulo);
  const [descripcion, setDescripcion] = useState(tarjeta.descripcion ?? '');
  const [estado, setEstado] = useState<EstadoTarjeta>(tarjeta.estado);
  const [progreso, setProgreso] = useState(tarjeta.progreso);
  const [fechaInicio, setFechaInicio] = useState(toDateInput(tarjeta.fechaInicio));
  const [fechaFin, setFechaFin] = useState(toDateInput(tarjeta.fechaFin));

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['tarjetas'] });
    qc.invalidateQueries({ queryKey: ['tableros'] });
  };

  const guardar = useMutation({
    mutationFn: () =>
      actualizarTarjeta(tarjeta.id, {
        titulo,
        descripcion: descripcion || undefined,
        estado,
        progreso,
        fechaInicio: fechaInicio ? fromDateInput(fechaInicio) : undefined,
        fechaFin: fechaFin ? fromDateInput(fechaFin) : undefined,
      }),
    onSuccess: () => { refrescar(); onClose(); },
  });

  const borrar = useMutation({
    mutationFn: () => eliminarTarjeta(tarjeta.id),
    onSuccess: () => { refrescar(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-900">Editar tarjeta</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Título</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Información general</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Estado</label>
              <Select value={estado} onChange={(e) => setEstado(e.target.value as EstadoTarjeta)}>
                {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Progreso: {progreso}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={progreso}
                onChange={(e) => setProgreso(Number(e.target.value))}
                className="mt-2 w-full accent-brand"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Inicio</label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Fin</label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => borrar.mutate()}
            disabled={borrar.isPending}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-4 w-4" /> Eliminar
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || !titulo.trim()}>
              <Save className="mr-1 h-4 w-4" /> Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

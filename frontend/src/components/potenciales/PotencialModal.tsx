import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Trash2, UserPlus, CheckCircle2 } from 'lucide-react';
import {
  actualizarPotencial, convertirPotencial, eliminarPotencial,
  ESTADOS_POTENCIAL, type EstadoPotencial, type Potencial,
} from '@/lib/potenciales-api';
import { errorMessage } from '@/lib/auth-api';
import { Button, Input, Select } from '@/components/ui';

export function PotencialModal({ potencial, onClose }: { potencial: Potencial; onClose: () => void }) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState(potencial.nombre);
  const [contacto, setContacto] = useState(potencial.contacto ?? '');
  const [origen, setOrigen] = useState(potencial.origen ?? '');
  const [notas, setNotas] = useState(potencial.notas ?? '');
  const [estado, setEstado] = useState<EstadoPotencial>(potencial.estado);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['potenciales'] });
    qc.invalidateQueries({ queryKey: ['clientes'] });
  };

  const guardar = useMutation({
    mutationFn: () => actualizarPotencial(potencial.id, { nombre, contacto, origen, notas, estado }),
    onSuccess: () => { refrescar(); onClose(); },
  });
  const borrar = useMutation({
    mutationFn: () => eliminarPotencial(potencial.id),
    onSuccess: () => { refrescar(); onClose(); },
  });
  const convertir = useMutation({
    mutationFn: () => convertirPotencial(potencial.id),
    onSuccess: (c) => { setMsg(`Convertido en cliente: ${c.nombre}`); refrescar(); },
    onError: (e) => setError(errorMessage(e, 'No se pudo convertir')),
  });

  const yaCliente = !!potencial.clienteConvertidoId;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-900">Potencial</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Nombre</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Contacto</label>
              <Input value={contacto} onChange={(e) => setContacto(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Origen</label>
              <Input value={origen} onChange={(e) => setOrigen(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Estado</label>
            <Select value={estado} onChange={(e) => setEstado(e.target.value as EstadoPotencial)}>
              {ESTADOS_POTENCIAL.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Notas</label>
            <textarea
              value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Conversión a cliente */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            {yaCliente ? (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Ya convertido en cliente{potencial.cliente ? `: ${potencial.cliente.nombre}` : ''}.
              </p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600">¿Cerrado? Conviértelo en cliente del módulo Clientes.</p>
                <Button onClick={() => convertir.mutate()} disabled={convertir.isPending}>
                  <UserPlus className="mr-1 h-4 w-4" /> Convertir
                </Button>
              </div>
            )}
            {msg && <p className="mt-2 text-sm text-emerald-600">{msg}</p>}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => borrar.mutate()} disabled={borrar.isPending} className="text-red-600 hover:bg-red-50">
            <Trash2 className="mr-1 h-4 w-4" /> Eliminar
          </Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || !nombre.trim()}>
            <Save className="mr-1 h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

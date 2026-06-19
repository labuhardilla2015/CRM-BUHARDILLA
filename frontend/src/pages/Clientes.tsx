import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Pencil, Save, X } from 'lucide-react';
import {
  actualizarCliente,
  crearCliente,
  getCliente,
  getClientes,
  type Cliente,
} from '@/lib/clientes-api';
import { errorMessage } from '@/lib/auth-api';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';
import { ControlPanel } from '@/components/clientes/ControlPanel';
import { BoardPanel } from '@/components/clientes/BoardPanel';
import { GlobalTasks } from '@/components/clientes/GlobalTasks';
import { Button, Input, Select } from '@/components/ui';

export function Clientes() {
  const usuario = useAuth((s) => s.usuario)!;
  const esAdmin = usuario.rol === 'ADMIN';
  const qc = useQueryClient();
  const [seleccionado, setSeleccionado] = useState('');
  const [añadiendo, setAñadiendo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [errCrear, setErrCrear] = useState('');

  const clientes = useQuery({ queryKey: ['clientes'], queryFn: getClientes });

  const crear = useMutation({
    mutationFn: () => crearCliente(nuevoNombre.trim()),
    onSuccess: (c) => {
      setNuevoNombre('');
      setAñadiendo(false);
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setSeleccionado(c.id);
    },
    onError: (e) => setErrCrear(errorMessage(e)),
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Clientes" subtitle="Selecciona un cliente para ver su ficha." />

      {/* Selector + añadir */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-64">
          <label className="mb-1 block text-xs font-medium text-slate-500">Cliente</label>
          <Select value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}>
            <option value="">— Elegir cliente —</option>
            {clientes.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </div>
        {añadiendo ? (
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Nuevo cliente</label>
              <Input
                autoFocus
                value={nuevoNombre}
                onChange={(e) => { setNuevoNombre(e.target.value); setErrCrear(''); }}
                placeholder="Nombre"
              />
            </div>
            <Button onClick={() => nuevoNombre.trim() && crear.mutate()} disabled={crear.isPending}>
              Guardar
            </Button>
            <Button variant="ghost" onClick={() => { setAñadiendo(false); setErrCrear(''); }}>Cancelar</Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setAñadiendo(true)}>
            <Plus className="mr-1 h-4 w-4" /> Añadir cliente
          </Button>
        )}
      </div>
      {errCrear && <p className="-mt-3 mb-4 text-sm text-red-600">{errCrear}</p>}

      {seleccionado ? (
        <FichaCliente clienteId={seleccionado} esAdmin={esAdmin} />
      ) : (
        <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center text-sm text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <Building2 className="h-8 w-8 text-slate-300" />
            Elige un cliente del desplegable para ver su ficha.
          </div>
        </div>
      )}
    </div>
  );
}

function FichaCliente({ clienteId, esAdmin }: { clienteId: string; esAdmin: boolean }) {
  const cliente = useQuery({ queryKey: ['cliente', clienteId], queryFn: () => getCliente(clienteId) });

  if (cliente.isLoading || !cliente.data) {
    return <p className="text-sm text-slate-400">Cargando ficha…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Cabecera de la ficha */}
      <div className="flex items-center gap-3 rounded-xl bg-sidebar px-5 py-4 text-white">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-lg font-semibold">
          {cliente.data.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{cliente.data.nombre}</h2>
          {cliente.data.contacto && <p className="text-sm text-slate-300">{cliente.data.contacto}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCliente cliente={cliente.data} esAdmin={esAdmin} />
      </div>

      {/* Control a todo el ancho (datos sensibles + hoja de claves) */}
      {esAdmin && <ControlPanel clienteId={clienteId} />}

      {/* Vista global de tareas en curso */}
      <GlobalTasks clienteId={clienteId} />

      {/* Tableros tipo Trello */}
      <BoardPanel clienteId={clienteId} />
    </div>
  );
}

function InfoCliente({ cliente, esAdmin }: { cliente: Cliente; esAdmin: boolean }) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [contacto, setContacto] = useState(cliente.contacto ?? '');
  const [notas, setNotas] = useState(cliente.notas ?? '');

  const guardar = useMutation({
    mutationFn: () => actualizarCliente(cliente.id, { contacto, notas }),
    onSuccess: () => {
      setEditando(false);
      qc.invalidateQueries({ queryKey: ['cliente', cliente.id] });
    },
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Información</h3>
        {esAdmin && !editando && (
          <button onClick={() => setEditando(true)} className="text-slate-400 hover:text-brand" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {editando ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Contacto</label>
            <Input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Email o teléfono" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
              <Save className="mr-1 h-4 w-4" /> Guardar
            </Button>
            <Button variant="ghost" onClick={() => setEditando(false)}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">Contacto</dt>
            <dd className="text-slate-700">{cliente.contacto || <span className="text-slate-300">—</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">Notas</dt>
            <dd className="whitespace-pre-wrap text-slate-700">{cliente.notas || <span className="text-slate-300">—</span>}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

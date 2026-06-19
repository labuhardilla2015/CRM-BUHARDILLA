import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Save, X, KeyRound, Search, ArrowLeft, ImagePlus, Info, Lock } from 'lucide-react';
import {
  actualizarCliente,
  crearCliente,
  getCliente,
  getClientes,
  subirLogo,
  type Cliente,
} from '@/lib/clientes-api';
import { errorMessage } from '@/lib/auth-api';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';
import { ControlPanel } from '@/components/clientes/ControlPanel';
import { BoardPanel } from '@/components/clientes/BoardPanel';
import { GlobalTasks } from '@/components/clientes/GlobalTasks';
import { EnlacesCliente, DocumentosCliente } from '@/components/clientes/ClienteRecursos';
import { ClienteLogo } from '@/components/clientes/ClienteLogo';
import { Modal } from '@/components/Modal';
import { Link } from 'react-router-dom';
import { Button, Input, Select } from '@/components/ui';

export function Clientes() {
  const usuario = useAuth((s) => s.usuario)!;
  const esAdmin = usuario.rol === 'ADMIN';
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const seleccionado = searchParams.get('cliente') ?? '';
  const setSeleccionado = (id: string) => setSearchParams(id ? { cliente: id } : {});

  const [busqueda, setBusqueda] = useState('');
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

  const filtrados = (clientes.data ?? []).filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  // Ficha de un cliente seleccionado
  if (seleccionado) {
    return (
      <div className="p-6 lg:p-8">
        <button
          onClick={() => setSeleccionado('')}
          className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" /> Todos los clientes
        </button>
        <FichaCliente clienteId={seleccionado} esAdmin={esAdmin} />
      </div>
    );
  }

  // Vista general: grid de todos los clientes + buscador + selector
  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Clientes" subtitle="Todos tus clientes. Busca o elige uno para ver su ficha." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="relative min-w-64 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Buscar</label>
          <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre del cliente…" className="pl-9" />
        </div>
        <div className="min-w-56">
          <label className="mb-1 block text-xs font-medium text-slate-500">Ir a cliente</label>
          <Select value="" onChange={(e) => e.target.value && setSeleccionado(e.target.value)}>
            <option value="">— Elegir —</option>
            {clientes.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </div>
        {añadiendo ? (
          <div className="flex items-end gap-2">
            <Input
              autoFocus value={nuevoNombre}
              onChange={(e) => { setNuevoNombre(e.target.value); setErrCrear(''); }}
              placeholder="Nuevo cliente"
            />
            <Button onClick={() => nuevoNombre.trim() && crear.mutate()} disabled={crear.isPending}>Guardar</Button>
            <Button variant="ghost" onClick={() => { setAñadiendo(false); setErrCrear(''); }}>Cancelar</Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setAñadiendo(true)}>
            <Plus className="mr-1 h-4 w-4" /> Añadir cliente
          </Button>
        )}
      </div>
      {errCrear && <p className="-mt-3 mb-4 text-sm text-red-600">{errCrear}</p>}

      {filtrados.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((c) => (
            <button
              key={c.id}
              onClick={() => setSeleccionado(c.id)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:ring-2 hover:ring-brand/30"
            >
              <ClienteLogo id={c.id} nombre={c.nombre} logoRuta={c.logoRuta} className="h-12 w-12 shrink-0 text-lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{c.nombre}</p>
                {c.contacto && <p className="truncate text-xs text-slate-400">{c.contacto}</p>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
          {clientes.isLoading ? 'Cargando…' : busqueda ? 'Ningún cliente coincide con la búsqueda.' : 'Aún no hay clientes.'}
        </p>
      )}
    </div>
  );
}

function FichaCliente({ clienteId, esAdmin }: { clienteId: string; esAdmin: boolean }) {
  const [verInfo, setVerInfo] = useState(false);
  const [verControl, setVerControl] = useState(false);
  const cliente = useQuery({ queryKey: ['cliente', clienteId], queryFn: () => getCliente(clienteId) });

  if (cliente.isLoading || !cliente.data) {
    return <p className="text-sm text-slate-400">Cargando ficha…</p>;
  }

  const btn = 'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition';

  return (
    <div className="space-y-6">
      {/* Cabecera de la ficha + botones (Info / Control / Claves) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sidebar px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <ClienteLogo id={clienteId} nombre={cliente.data.nombre} logoRuta={cliente.data.logoRuta} className="h-12 w-12 bg-white" />
          <div>
            <h2 className="text-lg font-semibold">{cliente.data.nombre}</h2>
            {cliente.data.contacto && <p className="text-sm text-slate-300">{cliente.data.contacto}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {esAdmin && <LogoUploader clienteId={clienteId} />}
          <button onClick={() => setVerInfo(true)} className={`${btn} bg-white/15 hover:bg-white/25`}>
            <Info className="h-4 w-4" /> Info general
          </button>
          {esAdmin && (
            <button onClick={() => setVerControl(true)} className={`${btn} bg-white/15 hover:bg-white/25`}>
              <Lock className="h-4 w-4" /> Control
            </button>
          )}
          <Link to={`/clientes/${clienteId}/claves`} className={`${btn} bg-brand hover:bg-brand-dark`}>
            <KeyRound className="h-4 w-4" /> Claves de acceso
          </Link>
        </div>
      </div>

      {/* Enlaces de interés, redes sociales y documentos */}
      <EnlacesCliente clienteId={clienteId} />
      <DocumentosCliente clienteId={clienteId} />

      {/* Vista global de tareas en curso */}
      <GlobalTasks clienteId={clienteId} />

      {/* Tableros tipo Trello */}
      <BoardPanel clienteId={clienteId} />

      {/* Modales */}
      {verInfo && (
        <Modal title="Información general" onClose={() => setVerInfo(false)}>
          <InfoCliente cliente={cliente.data} esAdmin={esAdmin} />
        </Modal>
      )}
      {esAdmin && verControl && (
        <Modal title="Control" maxW="max-w-2xl" onClose={() => setVerControl(false)}>
          <ControlPanel clienteId={clienteId} />
        </Modal>
      )}
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
    <section>
      <div className="mb-3 flex items-center justify-end">
        {esAdmin && !editando && (
          <button onClick={() => setEditando(true)} className="flex items-center gap-1 text-sm text-brand hover:underline" title="Editar">
            <Pencil className="h-4 w-4" /> Editar
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

function LogoUploader({ clienteId }: { clienteId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const subir = useMutation({
    mutationFn: (f: File) => subirLogo(clienteId, f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cliente', clienteId] });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      qc.invalidateQueries({ queryKey: ['logo', clienteId] });
    },
  });
  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={subir.isPending}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        <ImagePlus className="h-4 w-4" /> {subir.isPending ? 'Subiendo…' : 'Logo'}
      </button>
    </>
  );
}

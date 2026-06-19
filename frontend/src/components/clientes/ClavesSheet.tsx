import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Server, Plus, Eye, EyeOff, Copy, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  actualizarClave,
  crearClave,
  eliminarClave,
  getClaves,
  type Clave,
  type ClaveInput,
  type SeccionClave,
} from '@/lib/clientes-api';
import { Input } from '@/components/ui';

/** Hoja de claves del cliente, separada en Claves y Servidores. */
export function ClavesSheet({ clienteId }: { clienteId: string }) {
  const claves = useQuery({
    queryKey: ['claves', clienteId],
    queryFn: () => getClaves(clienteId),
  });

  const { porSeccion } = useMemo(() => {
    const map: Record<SeccionClave, Clave[]> = { CLAVE: [], SERVIDOR: [] };
    for (const c of claves.data ?? []) map[c.seccion].push(c);
    return { porSeccion: map };
  }, [claves.data]);

  return (
    <div className="space-y-6">
      <Seccion titulo="Claves" icon={KeyRound} seccion="CLAVE" items={porSeccion.CLAVE} clienteId={clienteId} />
      <Seccion titulo="Servidores" icon={Server} seccion="SERVIDOR" items={porSeccion.SERVIDOR} clienteId={clienteId} />
    </div>
  );
}

function Seccion({
  titulo,
  icon: Icon,
  seccion,
  items,
  clienteId,
}: {
  titulo: string;
  icon: typeof KeyRound;
  seccion: SeccionClave;
  items: Clave[];
  clienteId: string;
}) {
  const qc = useQueryClient();
  const [añadiendo, setAñadiendo] = useState(false);
  const refrescar = () => qc.invalidateQueries({ queryKey: ['claves', clienteId] });

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Icon className="h-4 w-4 text-brand" /> {titulo}
        </h5>
        <button onClick={() => setAñadiendo((v) => !v)} className="flex items-center gap-1 text-xs text-brand hover:underline">
          <Plus className="h-3.5 w-3.5" /> Añadir
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Etiqueta</th>
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Secreto</th>
              <th className="px-3 py-2 font-medium">URL</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((c) => (
              <ClaveRow key={c.id} clave={c} clienteId={clienteId} onChange={refrescar} />
            ))}
            {añadiendo && (
              <FilaNueva
                seccion={seccion}
                clienteId={clienteId}
                onDone={() => { setAñadiendo(false); refrescar(); }}
              />
            )}
            {items.length === 0 && !añadiendo && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">Sin entradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClaveRow({
  clave,
  clienteId,
  onChange,
}: {
  clave: Clave;
  clienteId: string;
  onChange: () => void;
}) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [ver, setVer] = useState(false);
  const [form, setForm] = useState<ClaveInput>({
    etiqueta: clave.etiqueta,
    usuario: clave.usuario ?? '',
    secreto: clave.secreto ?? '',
    url: clave.url ?? '',
  });

  const guardar = useMutation({
    mutationFn: () => actualizarClave(clienteId, clave.id, form),
    onSuccess: () => { setEditando(false); onChange(); },
  });
  const borrar = useMutation({
    mutationFn: () => eliminarClave(clienteId, clave.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['claves', clienteId] }); },
  });

  if (editando) {
    return (
      <tr className="bg-amber-50/40">
        <td className="px-2 py-1.5"><Input value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} /></td>
        <td className="px-2 py-1.5"><Input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></td>
        <td className="px-2 py-1.5"><Input value={form.secreto} onChange={(e) => setForm({ ...form, secreto: e.target.value })} /></td>
        <td className="px-2 py-1.5"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></td>
        <td className="whitespace-nowrap px-2 py-1.5">
          <button onClick={() => guardar.mutate()} className="text-emerald-600 hover:text-emerald-700" title="Guardar"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditando(false)} className="ml-2 text-slate-400 hover:text-slate-600" title="Cancelar"><X className="h-4 w-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="text-slate-700">
      <td className="px-3 py-2 font-medium">{clave.etiqueta}</td>
      <td className="px-3 py-2">{clave.usuario || <span className="text-slate-300">—</span>}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono">{clave.secreto ? (ver ? clave.secreto : '••••••••') : '—'}</span>
          {clave.secreto && (
            <>
              <button onClick={() => setVer((v) => !v)} className="text-slate-400 hover:text-brand" title={ver ? 'Ocultar' : 'Mostrar'}>
                {ver ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => navigator.clipboard.writeText(clave.secreto!)} className="text-slate-400 hover:text-brand" title="Copiar">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
      <td className="max-w-40 truncate px-3 py-2">
        {clave.url ? (
          <a href={clave.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{clave.url}</a>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <button onClick={() => setEditando(true)} className="text-slate-400 hover:text-brand" title="Editar"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => borrar.mutate()} className="ml-2 text-slate-400 hover:text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}

function FilaNueva({
  seccion,
  clienteId,
  onDone,
}: {
  seccion: SeccionClave;
  clienteId: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState<ClaveInput>({ seccion, etiqueta: '', usuario: '', secreto: '', url: '' });
  const crear = useMutation({
    mutationFn: () => crearClave(clienteId, { ...form, seccion }),
    onSuccess: onDone,
  });

  return (
    <tr className="bg-emerald-50/40">
      <td className="px-2 py-1.5"><Input autoFocus placeholder="Etiqueta" value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} /></td>
      <td className="px-2 py-1.5"><Input placeholder="Usuario" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></td>
      <td className="px-2 py-1.5"><Input placeholder="Secreto" value={form.secreto} onChange={(e) => setForm({ ...form, secreto: e.target.value })} /></td>
      <td className="px-2 py-1.5"><Input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></td>
      <td className="whitespace-nowrap px-2 py-1.5">
        <button onClick={() => form.etiqueta?.trim() && crear.mutate()} className="text-emerald-600 hover:text-emerald-700" title="Crear"><Check className="h-4 w-4" /></button>
        <button onClick={onDone} className="ml-2 text-slate-400 hover:text-slate-600" title="Cancelar"><X className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}

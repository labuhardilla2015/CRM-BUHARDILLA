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

/** Hoja de claves del cliente, estilo hoja de cálculo (Claves y Servidores). */
export function ClavesSheet({ clienteId }: { clienteId: string }) {
  const claves = useQuery({
    queryKey: ['claves', clienteId],
    queryFn: () => getClaves(clienteId),
  });

  const porSeccion = useMemo(() => {
    const map: Record<SeccionClave, Clave[]> = { CLAVE: [], SERVIDOR: [] };
    for (const c of claves.data ?? []) map[c.seccion].push(c);
    return map;
  }, [claves.data]);

  return (
    <div className="space-y-8">
      <Seccion titulo="Claves" icon={KeyRound} seccion="CLAVE" items={porSeccion.CLAVE} clienteId={clienteId} />
      <Seccion titulo="Servidores" icon={Server} seccion="SERVIDOR" items={porSeccion.SERVIDOR} clienteId={clienteId} />
    </div>
  );
}

const TH = 'border border-slate-200 bg-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500';
const TD = 'border border-slate-200 px-3 py-2 align-top';
const CELL_INPUT = 'w-full bg-transparent text-sm outline-none placeholder:text-slate-300';

function Seccion({
  titulo, icon: Icon, seccion, items, clienteId,
}: {
  titulo: string; icon: typeof KeyRound; seccion: SeccionClave; items: Clave[]; clienteId: string;
}) {
  const qc = useQueryClient();
  const [añadiendo, setAñadiendo] = useState(false);
  const refrescar = () => qc.invalidateQueries({ queryKey: ['claves', clienteId] });

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Icon className="h-5 w-5 text-brand" /> {titulo}
        </h3>
        <button onClick={() => setAñadiendo(true)} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark">
          <Plus className="h-3.5 w-3.5" /> Añadir fila
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-48`}>Etiqueta</th>
              <th className={`${TH} w-40`}>Usuario</th>
              <th className={`${TH} w-48`}>Secreto</th>
              <th className={`${TH} w-56`}>URL</th>
              <th className={TH}>Notas</th>
              <th className={`${TH} w-24 text-center`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, i) => (
              <ClaveRow key={c.id} clave={c} clienteId={clienteId} zebra={i % 2 === 1} onChange={refrescar} />
            ))}
            {añadiendo && (
              <FilaNueva seccion={seccion} clienteId={clienteId} onDone={() => { setAñadiendo(false); refrescar(); }} />
            )}
            {items.length === 0 && !añadiendo && (
              <tr><td className={`${TD} text-center text-slate-400`} colSpan={6}>Sin entradas. Pulsa “Añadir fila”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClaveRow({
  clave, clienteId, zebra, onChange,
}: {
  clave: Clave; clienteId: string; zebra: boolean; onChange: () => void;
}) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [ver, setVer] = useState(false);
  const [form, setForm] = useState<ClaveInput>({
    etiqueta: clave.etiqueta, usuario: clave.usuario ?? '', secreto: clave.secreto ?? '',
    url: clave.url ?? '', notas: clave.notas ?? '',
  });

  const guardar = useMutation({
    mutationFn: () => actualizarClave(clienteId, clave.id, form),
    onSuccess: () => { setEditando(false); onChange(); },
  });
  const borrar = useMutation({
    mutationFn: () => eliminarClave(clienteId, clave.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claves', clienteId] }),
  });

  if (editando) {
    return (
      <tr className="bg-amber-50/50">
        <td className={TD}><input className={CELL_INPUT} value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} /></td>
        <td className={TD}><input className={CELL_INPUT} value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></td>
        <td className={TD}><input className={CELL_INPUT} value={form.secreto} onChange={(e) => setForm({ ...form, secreto: e.target.value })} /></td>
        <td className={TD}><input className={CELL_INPUT} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></td>
        <td className={TD}><input className={CELL_INPUT} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></td>
        <td className={`${TD} whitespace-nowrap text-center`}>
          <button onClick={() => guardar.mutate()} className="text-emerald-600 hover:text-emerald-700" title="Guardar"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditando(false)} className="ml-2 text-slate-400 hover:text-slate-600" title="Cancelar"><X className="h-4 w-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className={zebra ? 'bg-slate-50/60' : ''}>
      <td className={`${TD} font-medium text-slate-800`}>{clave.etiqueta}</td>
      <td className={`${TD} text-slate-700`}>{clave.usuario || <span className="text-slate-300">—</span>}</td>
      <td className={TD}>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-slate-700">{clave.secreto ? (ver ? clave.secreto : '••••••••') : '—'}</span>
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
      <td className={TD}>
        {clave.url
          ? <a href={clave.url} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">{clave.url}</a>
          : <span className="text-slate-300">—</span>}
      </td>
      <td className={`${TD} text-slate-600`}>{clave.notas || <span className="text-slate-300">—</span>}</td>
      <td className={`${TD} whitespace-nowrap text-center`}>
        <button onClick={() => setEditando(true)} className="text-slate-400 hover:text-brand" title="Editar"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => borrar.mutate()} className="ml-2 text-slate-400 hover:text-red-600" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}

function FilaNueva({
  seccion, clienteId, onDone,
}: {
  seccion: SeccionClave; clienteId: string; onDone: () => void;
}) {
  const [form, setForm] = useState<ClaveInput>({ seccion, etiqueta: '', usuario: '', secreto: '', url: '', notas: '' });
  const crear = useMutation({ mutationFn: () => crearClave(clienteId, { ...form, seccion }), onSuccess: onDone });

  return (
    <tr className="bg-emerald-50/50">
      <td className={TD}><input autoFocus className={CELL_INPUT} placeholder="Etiqueta" value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} /></td>
      <td className={TD}><input className={CELL_INPUT} placeholder="Usuario" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></td>
      <td className={TD}><input className={CELL_INPUT} placeholder="Secreto" value={form.secreto} onChange={(e) => setForm({ ...form, secreto: e.target.value })} /></td>
      <td className={TD}><input className={CELL_INPUT} placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></td>
      <td className={TD}><input className={CELL_INPUT} placeholder="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></td>
      <td className={`${TD} whitespace-nowrap text-center`}>
        <button onClick={() => form.etiqueta?.trim() && crear.mutate()} className="text-emerald-600 hover:text-emerald-700" title="Crear"><Check className="h-4 w-4" /></button>
        <button onClick={onDone} className="ml-2 text-slate-400 hover:text-slate-600" title="Cancelar"><X className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Share2, Plus, Trash2, ExternalLink, Paperclip, Download, FileText } from 'lucide-react';
import {
  crearEnlace, descargarDocumentoCliente, eliminarDocumentoCliente, eliminarEnlace,
  getDocumentosCliente, getEnlaces, subirDocumentoCliente,
  type EnlaceCliente, type TipoEnlace,
} from '@/lib/clientes-api';
import { errorMessage } from '@/lib/auth-api';
import { Button, Input } from '@/components/ui';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Enlaces de interés + redes sociales ────────────────────────────
export function EnlacesCliente({ clienteId }: { clienteId: string }) {
  const enlaces = useQuery({ queryKey: ['enlaces', clienteId], queryFn: () => getEnlaces(clienteId) });
  const deInteres = (enlaces.data ?? []).filter((e) => e.tipo === 'ENLACE');
  const redes = (enlaces.data ?? []).filter((e) => e.tipo === 'RED_SOCIAL');

  return (
    <section>
      <div className="grid gap-6 md:grid-cols-2">
        <Bloque titulo="Enlaces de interés" icon={Link2} tipo="ENLACE" items={deInteres} clienteId={clienteId} placeholder="https://drive.google.com/…" />
        <Bloque titulo="Redes sociales" icon={Share2} tipo="RED_SOCIAL" items={redes} clienteId={clienteId} placeholder="https://instagram.com/…" />
      </div>
    </section>
  );
}

function Bloque({
  titulo, icon: Icon, tipo, items, clienteId, placeholder,
}: {
  titulo: string; icon: typeof Link2; tipo: TipoEnlace; items: EnlaceCliente[];
  clienteId: string; placeholder: string;
}) {
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [etiqueta, setEtiqueta] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const refrescar = () => qc.invalidateQueries({ queryKey: ['enlaces', clienteId] });

  const crear = useMutation({
    mutationFn: () => crearEnlace(clienteId, { tipo, etiqueta: etiqueta.trim(), url: url.trim() }),
    onSuccess: () => { setEtiqueta(''); setUrl(''); setAbierto(false); refrescar(); },
    onError: (e) => setError(errorMessage(e, 'Revisa la URL (debe incluir https://)')),
  });
  const borrar = useMutation({ mutationFn: (id: string) => eliminarEnlace(id), onSuccess: refrescar });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Icon className="h-4 w-4 text-brand" /> {titulo}
        </h4>
        <button onClick={() => setAbierto((v) => !v)} className="flex items-center gap-1 text-xs text-brand hover:underline">
          <Plus className="h-3.5 w-3.5" /> Añadir
        </button>
      </div>
      <ul className="space-y-1.5">
        {items.length === 0 && <li className="text-sm text-slate-400">Sin entradas.</li>}
        {items.map((e) => (
          <li key={e.id} className="group flex items-center gap-2 text-sm">
            <a href={e.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1 text-slate-700 hover:text-brand">
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{e.etiqueta}</span>
            </a>
            <button onClick={() => borrar.mutate(e.id)} className="ml-auto text-slate-300 opacity-0 hover:text-red-600 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {abierto && (
        <div className="mt-2 space-y-2">
          <Input value={etiqueta} onChange={(e) => { setEtiqueta(e.target.value); setError(''); }} placeholder="Etiqueta (p. ej. Instagram)" />
          <Input value={url} onChange={(e) => { setUrl(e.target.value); setError(''); }} placeholder={placeholder} />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={() => etiqueta.trim() && url.trim() && crear.mutate()} disabled={crear.isPending}>Guardar</Button>
            <Button variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Documentos del cliente ─────────────────────────────────────────
export function DocumentosCliente({ clienteId }: { clienteId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const docs = useQuery({ queryKey: ['docs-cliente', clienteId], queryFn: () => getDocumentosCliente(clienteId) });
  const refrescar = () => qc.invalidateQueries({ queryKey: ['docs-cliente', clienteId] });

  const subir = useMutation({ mutationFn: (f: File) => subirDocumentoCliente(clienteId, f), onSuccess: refrescar });
  const borrar = useMutation({ mutationFn: (id: string) => eliminarDocumentoCliente(id), onSuccess: refrescar });

  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <FileText className="h-4 w-4 text-brand" /> Documentos
      </h4>
      <ul className="space-y-1">
        {docs.data?.length === 0 && <li className="text-sm text-slate-400">Sin documentos.</li>}
        {docs.data?.map((d) => (
          <li key={d.id} className="group flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-slate-700">{d.nombre}</span>
            <span className="text-xs text-slate-400">{formatBytes(d.tamano)}</span>
            <button onClick={() => descargarDocumentoCliente(d.id, d.nombre)} className="ml-auto text-slate-400 hover:text-brand" title="Descargar">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={() => borrar.mutate(d.id)} className="text-slate-300 hover:text-red-600" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }} />
      <Button variant="ghost" className="mt-2" onClick={() => fileRef.current?.click()} disabled={subir.isPending}>
        <Paperclip className="mr-1 h-4 w-4" /> {subir.isPending ? 'Subiendo…' : 'Subir documento'}
      </Button>
    </section>
  );
}

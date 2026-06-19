import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Trash2, Save, X, Paperclip, Download, Send, CheckSquare, Users2, MessageSquare,
} from 'lucide-react';
import {
  actualizarTarjeta, eliminarTarjeta, ESTADOS,
  getTarjetaDetalle, comentar, borrarComentario,
  addChecklist, patchChecklist, borrarChecklist,
  setAsignados, subirArchivo, borrarArchivo, descargarArchivo,
  type EstadoTarjeta, type Tarjeta, type TarjetaDetalle,
} from '@/lib/tableros-api';
import { getUsuarios } from '@/lib/informes-api';
import { fromDateInput, toDateInput, formatHora, formatFecha } from '@/lib/tiempo';
import { useAuth } from '@/store/auth';
import { Button, Input, Select } from '@/components/ui';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function CardModal({ tarjeta, onClose }: { tarjeta: Tarjeta; onClose: () => void }) {
  const qc = useQueryClient();
  const detalle = useQuery({ queryKey: ['tarjeta-detalle', tarjeta.id], queryFn: () => getTarjetaDetalle(tarjeta.id) });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['tarjeta-detalle', tarjeta.id] });
    qc.invalidateQueries({ queryKey: ['tarjetas'] });
    qc.invalidateQueries({ queryKey: ['tableros'] });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-900">Tarjeta</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <Editables tarjeta={tarjeta} onSaved={refrescar} onClose={onClose} />

        {detalle.data && (
          <div className="mt-6 space-y-6 border-t border-slate-100 pt-6">
            <AsignadosSection d={detalle.data} onChange={refrescar} />
            <ChecklistSection d={detalle.data} onChange={refrescar} />
            <ComentariosSection d={detalle.data} onChange={refrescar} />
            <ArchivosSection d={detalle.data} onChange={refrescar} />
          </div>
        )}
      </div>
    </div>
  );
}

function Editables({ tarjeta, onSaved, onClose }: { tarjeta: Tarjeta; onSaved: () => void; onClose: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState(tarjeta.titulo);
  const [descripcion, setDescripcion] = useState(tarjeta.descripcion ?? '');
  const [estado, setEstado] = useState<EstadoTarjeta>(tarjeta.estado);
  const [progreso, setProgreso] = useState(tarjeta.progreso);
  const [fechaInicio, setFechaInicio] = useState(toDateInput(tarjeta.fechaInicio));
  const [fechaFin, setFechaFin] = useState(toDateInput(tarjeta.fechaFin));

  const guardar = useMutation({
    mutationFn: () => actualizarTarjeta(tarjeta.id, {
      titulo, descripcion: descripcion || undefined, estado, progreso,
      fechaInicio: fechaInicio ? fromDateInput(fechaInicio) : undefined,
      fechaFin: fechaFin ? fromDateInput(fechaFin) : undefined,
    }),
    onSuccess: () => { onSaved(); onClose(); },
  });
  const borrar = useMutation({
    mutationFn: () => eliminarTarjeta(tarjeta.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tarjetas'] }); qc.invalidateQueries({ queryKey: ['tableros'] }); onClose(); },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Título</label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Información general</label>
        <textarea
          value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
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
          <input type="range" min={0} max={100} value={progreso} onChange={(e) => setProgreso(Number(e.target.value))} className="mt-2 w-full accent-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Inicio</label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Fin</label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => borrar.mutate()} disabled={borrar.isPending} className="text-red-600 hover:bg-red-50">
          <Trash2 className="mr-1 h-4 w-4" /> Eliminar
        </Button>
        <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || !titulo.trim()}>
          <Save className="mr-1 h-4 w-4" /> Guardar
        </Button>
      </div>
    </div>
  );
}

function AsignadosSection({ d, onChange }: { d: TarjetaDetalle; onChange: () => void }) {
  const esAdmin = useAuth((s) => s.usuario)!.rol === 'ADMIN';
  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: getUsuarios, enabled: esAdmin });
  const asignadosIds = d.asignaciones.map((a) => a.usuarioId);

  const toggle = useMutation({
    mutationFn: (uid: string) => {
      const next = asignadosIds.includes(uid)
        ? asignadosIds.filter((x) => x !== uid)
        : [...asignadosIds, uid];
      return setAsignados(d.id, next);
    },
    onSuccess: onChange,
  });

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Users2 className="h-4 w-4 text-brand" /> Asignados
      </h4>
      <div className="flex flex-wrap items-center gap-2">
        {d.asignaciones.length === 0 && <span className="text-sm text-slate-400">Sin asignar.</span>}
        {d.asignaciones.map((a) => (
          <span key={a.usuarioId} className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] text-white">
              {a.usuario.nombre.charAt(0).toUpperCase()}
            </span>
            {a.usuario.nombre}
          </span>
        ))}
      </div>
      {esAdmin && (
        <div className="mt-3 flex flex-wrap gap-2">
          {usuarios.data?.map((u) => {
            const on = asignadosIds.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle.mutate(u.id)}
                className={`rounded-full px-2.5 py-1 text-xs transition ${on ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {on ? '✓ ' : '+ '}{u.nombre}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ChecklistSection({ d, onChange }: { d: TarjetaDetalle; onChange: () => void }) {
  const [texto, setTexto] = useState('');
  const items = d.checklistItems;
  const hechos = items.filter((i) => i.completado).length;
  const pct = items.length ? Math.round((hechos / items.length) * 100) : 0;

  const add = useMutation({ mutationFn: () => addChecklist(d.id, texto.trim()), onSuccess: () => { setTexto(''); onChange(); } });
  const toggle = useMutation({ mutationFn: (it: { id: string; completado: boolean }) => patchChecklist(it.id, { completado: !it.completado }), onSuccess: onChange });
  const del = useMutation({ mutationFn: (id: string) => borrarChecklist(id), onSuccess: onChange });

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <CheckSquare className="h-4 w-4 text-brand" /> Checklist {items.length > 0 && <span className="text-xs font-normal text-slate-400">({hechos}/{items.length})</span>}
      </h4>
      {items.length > 0 && (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      )}
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="group flex items-center gap-2 text-sm">
            <input type="checkbox" checked={it.completado} onChange={() => toggle.mutate(it)} className="accent-brand" />
            <span className={it.completado ? 'text-slate-400 line-through' : 'text-slate-700'}>{it.texto}</span>
            <button onClick={() => del.mutate(it.id)} className="ml-auto text-slate-300 opacity-0 hover:text-red-600 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <Input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && texto.trim() && add.mutate()} placeholder="Nuevo ítem…" />
        <Button onClick={() => texto.trim() && add.mutate()} disabled={add.isPending}>Añadir</Button>
      </div>
    </section>
  );
}

function ComentariosSection({ d, onChange }: { d: TarjetaDetalle; onChange: () => void }) {
  const yo = useAuth((s) => s.usuario)!;
  const [texto, setTexto] = useState('');
  const enviar = useMutation({ mutationFn: () => comentar(d.id, texto.trim()), onSuccess: () => { setTexto(''); onChange(); } });
  const del = useMutation({ mutationFn: (id: string) => borrarComentario(id), onSuccess: onChange });

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MessageSquare className="h-4 w-4 text-brand" /> Comentarios
      </h4>
      <div className="space-y-2">
        {d.comentarios.length === 0 && <p className="text-sm text-slate-400">Sin comentarios todavía.</p>}
        {d.comentarios.map((c) => (
          <div key={c.id} className="group rounded-lg bg-slate-50 p-2.5">
            <div className="mb-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-600">{c.usuario.nombre}</span>
              <span className="capitalize">{formatFecha(c.createdAt)} {formatHora(c.createdAt)}</span>
              {(c.usuarioId === yo.id || yo.rol === 'ADMIN') && (
                <button onClick={() => del.mutate(c.id)} className="ml-auto text-slate-300 opacity-0 hover:text-red-600 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{c.texto}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && texto.trim() && enviar.mutate()} placeholder="Escribe un comentario…" />
        <Button onClick={() => texto.trim() && enviar.mutate()} disabled={enviar.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function ArchivosSection({ d, onChange }: { d: TarjetaDetalle; onChange: () => void }) {
  const yo = useAuth((s) => s.usuario)!;
  const fileRef = useRef<HTMLInputElement>(null);
  const subir = useMutation({ mutationFn: (file: File) => subirArchivo(d.id, file), onSuccess: onChange });
  const del = useMutation({ mutationFn: (id: string) => borrarArchivo(id), onSuccess: onChange });

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Paperclip className="h-4 w-4 text-brand" /> Archivos
      </h4>
      <ul className="space-y-1">
        {d.archivos.length === 0 && <li className="text-sm text-slate-400">Sin archivos adjuntos.</li>}
        {d.archivos.map((a) => (
          <li key={a.id} className="group flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-slate-700">{a.nombre}</span>
            <span className="text-xs text-slate-400">{formatBytes(a.tamano)}</span>
            <button onClick={() => descargarArchivo(a.id, a.nombre)} className="ml-auto text-slate-400 hover:text-brand" title="Descargar">
              <Download className="h-4 w-4" />
            </button>
            {(a.usuarioId === yo.id || yo.rol === 'ADMIN') && (
              <button onClick={() => del.mutate(a.id)} className="text-slate-300 hover:text-red-600" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }}
      />
      <Button variant="ghost" className="mt-2" onClick={() => fileRef.current?.click()} disabled={subir.isPending}>
        <Paperclip className="mr-1 h-4 w-4" /> {subir.isPending ? 'Subiendo…' : 'Adjuntar archivo'}
      </Button>
    </section>
  );
}

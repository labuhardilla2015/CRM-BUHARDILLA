import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Send, Link2, Trash2, Plus, Check, Paperclip, Download } from 'lucide-react';
import {
  crearPresupuesto, descargarPdfPresupuesto, eliminarPresupuesto, enviarPresupuesto,
  ESTADO_PRESUPUESTO_LABEL, formatEuro, getPresupuestos, subirPdfPresupuesto,
  type EstadoPresupuesto, type Presupuesto,
} from '@/lib/presupuestos-api';
import { Button, Input } from '@/components/ui';

const BADGE: Record<EstadoPresupuesto, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600',
  ENVIADO: 'bg-amber-100 text-amber-700',
  ACEPTADO: 'bg-emerald-100 text-emerald-700',
  RECHAZADO: 'bg-red-100 text-red-700',
};

function enlacePublico(token: string) {
  return `${window.location.origin}/presupuesto/${token}`;
}

export function PresupuestosSection({ potencialId }: { potencialId: string }) {
  const qc = useQueryClient();
  const [añadiendo, setAñadiendo] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [copiado, setCopiado] = useState('');

  const presupuestos = useQuery({ queryKey: ['presupuestos', potencialId], queryFn: () => getPresupuestos(potencialId) });
  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['presupuestos', potencialId] });
    qc.invalidateQueries({ queryKey: ['potenciales'] });
  };

  const crear = useMutation({
    mutationFn: () => crearPresupuesto(potencialId, { concepto: concepto.trim(), monto: Number(monto) }),
    onSuccess: () => { setConcepto(''); setMonto(''); setAñadiendo(false); refrescar(); },
  });
  const enviar = useMutation({
    mutationFn: (id: string) => enviarPresupuesto(id),
    onSuccess: async ({ token }) => {
      await navigator.clipboard.writeText(enlacePublico(token)).catch(() => undefined);
      setCopiado(token);
      setTimeout(() => setCopiado(''), 2500);
      refrescar();
    },
  });
  const borrar = useMutation({ mutationFn: (id: string) => eliminarPresupuesto(id), onSuccess: refrescar });

  function copiarEnlace(p: Presupuesto) {
    if (!p.tokenAceptacion) return;
    navigator.clipboard.writeText(enlacePublico(p.tokenAceptacion)).catch(() => undefined);
    setCopiado(p.tokenAceptacion);
    setTimeout(() => setCopiado(''), 2500);
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FileText className="h-4 w-4 text-brand" /> Presupuestos
        </h4>
        <button onClick={() => setAñadiendo((v) => !v)} className="flex items-center gap-1 text-xs text-brand hover:underline">
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </button>
      </div>

      <div className="space-y-2">
        {presupuestos.data?.length === 0 && !añadiendo && (
          <p className="text-sm text-slate-400">Sin presupuestos.</p>
        )}
        {presupuestos.data?.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-800">{p.concepto}</p>
              <p className="text-xs text-slate-500">{formatEuro(p.monto)}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE[p.estado]}`}>
              {ESTADO_PRESUPUESTO_LABEL[p.estado]}
            </span>
            {p.estado === 'BORRADOR' ? (
              <button onClick={() => enviar.mutate(p.id)} className="text-slate-400 hover:text-brand" title="Enviar (genera enlace)">
                <Send className="h-4 w-4" />
              </button>
            ) : (
              p.tokenAceptacion && (
                <button onClick={() => copiarEnlace(p)} className="text-slate-400 hover:text-brand" title="Copiar enlace público">
                  {copiado === p.tokenAceptacion ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
                </button>
              )
            )}
            <PdfBoton presupuesto={p} onChange={refrescar} />
            <button onClick={() => borrar.mutate(p.id)} className="text-slate-400 hover:text-red-600" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {añadiendo && (
          <div className="flex items-end gap-2 rounded-lg bg-slate-50 p-2">
            <div className="flex-1">
              <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto" />
            </div>
            <div className="w-28">
              <Input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="€" />
            </div>
            <Button onClick={() => concepto.trim() && monto && crear.mutate()} disabled={crear.isPending}>Crear</Button>
          </div>
        )}
      </div>

      {copiado && <p className="mt-2 text-xs text-emerald-600">Enlace público copiado al portapapeles ✓</p>}
    </section>
  );
}

function PdfBoton({ presupuesto, onChange }: { presupuesto: Presupuesto; onChange: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const subir = useMutation({
    mutationFn: (f: File) => subirPdfPresupuesto(presupuesto.id, f),
    onSuccess: onChange,
  });
  return (
    <>
      <input
        ref={fileRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }}
      />
      {presupuesto.archivoNombre ? (
        <button
          onClick={() => descargarPdfPresupuesto(presupuesto.id, presupuesto.archivoNombre!)}
          className="text-brand hover:text-brand-dark"
          title={`Descargar ${presupuesto.archivoNombre}`}
        >
          <Download className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={subir.isPending} className="text-slate-400 hover:text-brand" title="Adjuntar PDF del presupuesto">
          <Paperclip className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

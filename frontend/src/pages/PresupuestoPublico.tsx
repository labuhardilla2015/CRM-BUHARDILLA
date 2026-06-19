import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import {
  aceptarPresupuesto, ESTADO_PRESUPUESTO_LABEL, formatEuro,
  getPresupuestoPublico, rechazarPresupuesto,
} from '@/lib/presupuestos-api';
import { Button } from '@/components/ui';

export function PresupuestoPublico() {
  const { token = '' } = useParams();
  const qc = useQueryClient();
  const p = useQuery({ queryKey: ['presupuesto-publico', token], queryFn: () => getPresupuestoPublico(token), retry: false });

  const refrescar = () => qc.invalidateQueries({ queryKey: ['presupuesto-publico', token] });
  const aceptar = useMutation({ mutationFn: () => aceptarPresupuesto(token), onSuccess: refrescar });
  const rechazar = useMutation({ mutationFn: () => rechazarPresupuesto(token), onSuccess: refrescar });

  return (
    <div className="grid min-h-full place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
        <div className="flex items-center justify-center bg-sidebar px-8 py-6">
          <img src="/logo.png" alt="La Buhardilla" className="h-10 w-auto" />
        </div>

        <div className="p-8">
          {p.isLoading ? (
            <p className="text-center text-slate-400">Cargando…</p>
          ) : p.isError || !p.data ? (
            <div className="text-center">
              <XCircle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">Este presupuesto no existe o el enlace no es válido.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 text-center">
                <FileText className="mx-auto mb-2 h-7 w-7 text-brand" />
                <h1 className="text-lg font-semibold text-slate-900">Propuesta de presupuesto</h1>
                {p.data.destinatario && <p className="text-sm text-slate-500">Para {p.data.destinatario}</p>}
              </div>

              <div className="mb-6 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-800">{p.data.concepto}</p>
                {p.data.detalle && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{p.data.detalle}</p>}
                <p className="mt-3 text-2xl font-bold text-brand">{formatEuro(p.data.monto)}</p>
              </div>

              {p.data.estado === 'ENVIADO' ? (
                <div className="space-y-2">
                  <Button onClick={() => aceptar.mutate()} disabled={aceptar.isPending || rechazar.isPending} className="w-full">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Aceptar presupuesto
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => rechazar.mutate()}
                    disabled={aceptar.isPending || rechazar.isPending}
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    Rechazar
                  </Button>
                </div>
              ) : p.data.estado === 'ACEPTADO' ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-center text-emerald-700">
                  <CheckCircle2 className="mx-auto mb-1 h-7 w-7" />
                  <p className="text-sm font-medium">¡Presupuesto aceptado! Gracias.</p>
                </div>
              ) : p.data.estado === 'RECHAZADO' ? (
                <div className="rounded-xl bg-red-50 p-4 text-center text-red-700">
                  <XCircle className="mx-auto mb-1 h-7 w-7" />
                  <p className="text-sm font-medium">Has rechazado este presupuesto.</p>
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400">
                  Estado: {ESTADO_PRESUPUESTO_LABEL[p.data.estado]}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

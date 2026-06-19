import { X, KeyRound } from 'lucide-react';
import { ClavesSheet } from './ClavesSheet';

/** Modal con la hoja de claves/servidores del cliente (acceso rápido). */
export function ClavesModal({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <KeyRound className="h-5 w-5 text-brand" /> Claves de acceso
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ClavesSheet clienteId={clienteId} />
      </div>
    </div>
  );
}

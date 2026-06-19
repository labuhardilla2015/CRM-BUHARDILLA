import { X } from 'lucide-react';

/** Modal genérico centrado, con título y cierre. */
export function Modal({
  title,
  onClose,
  children,
  maxW = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`max-h-[90vh] w-full ${maxW} overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

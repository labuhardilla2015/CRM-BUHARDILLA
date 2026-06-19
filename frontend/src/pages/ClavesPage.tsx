import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { getCliente } from '@/lib/clientes-api';
import { ClavesSheet } from '@/components/clientes/ClavesSheet';

/** Hoja de claves a pantalla completa, estilo hoja de cálculo. */
export function ClavesPage() {
  const { id = '' } = useParams();
  const cliente = useQuery({ queryKey: ['cliente', id], queryFn: () => getCliente(id) });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/clientes" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Volver a clientes">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Claves de acceso</h1>
          <p className="text-sm text-slate-500">{cliente.data?.nombre ?? '…'}</p>
        </div>
      </div>

      <ClavesSheet clienteId={id} />
    </div>
  );
}

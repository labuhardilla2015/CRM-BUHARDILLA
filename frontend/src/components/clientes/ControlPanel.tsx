import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Lock, Unlock, ShieldCheck, Save } from 'lucide-react';
import {
  getDatosSensibles,
  setDatosSensibles,
  unlockControl,
} from '@/lib/clientes-api';
import { errorMessage } from '@/lib/auth-api';
import { Button, Input } from '@/components/ui';

/**
 * Apartado "Control" del cliente (solo admins). Pide la contraseña de Control,
 * obtiene un token de control de corta duración y permite ver/editar los datos
 * sensibles (cifrados en el backend).
 */
export function ControlPanel({ clienteId }: { clienteId: string }) {
  const [controlToken, setControlToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const unlock = useMutation({
    mutationFn: () => unlockControl(clienteId, password),
    onSuccess: (token) => { setControlToken(token); setPassword(''); setError(''); },
    onError: (e) => setError(errorMessage(e, 'No se pudo desbloquear')),
  });

  if (!controlToken) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Lock className="h-4 w-4 text-brand" /> Control · datos sensibles
        </h3>
        <p className="mb-4 text-sm text-slate-500">
          Zona protegida (solo admins). Introduce la contraseña de Control para ver los
          datos sensibles del cliente.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (password) unlock.mutate(); }}
          className="flex max-w-sm items-center gap-2"
        >
          <Input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Contraseña de Control"
            autoComplete="off"
          />
          <Button type="submit" disabled={unlock.isPending || !password}>
            <Unlock className="mr-1 h-4 w-4" /> Entrar
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>
    );
  }

  return <DatosSensibles clienteId={clienteId} controlToken={controlToken} />;
}

function DatosSensibles({ clienteId, controlToken }: { clienteId: string; controlToken: string }) {
  const [texto, setTexto] = useState<string>('');
  const [cargado, setCargado] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);

  const datos = useQuery({
    queryKey: ['datos-sensibles', clienteId],
    queryFn: async () => {
      const d = await getDatosSensibles(clienteId, controlToken);
      setTexto(d ?? '');
      setCargado(true);
      return d ?? '';
    },
  });

  const guardar = useMutation({
    mutationFn: () => setDatosSensibles(clienteId, controlToken, texto),
    onSuccess: () => { setGuardadoOk(true); setTimeout(() => setGuardadoOk(false), 2000); },
  });

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <ShieldCheck className="h-4 w-4" /> Control · desbloqueado
      </h3>
      <p className="mb-3 text-sm text-slate-500">Datos sensibles (cifrados en la base de datos).</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        disabled={!cargado}
        placeholder={datos.isLoading ? 'Cargando…' : 'Datos confidenciales del cliente…'}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || !cargado}>
          <Save className="mr-1 h-4 w-4" /> Guardar
        </Button>
        {guardadoOk && <span className="text-sm text-emerald-600">Guardado ✓</span>}
      </div>
    </section>
  );
}

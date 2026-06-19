import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarClock, CheckCheck } from 'lucide-react';
import {
  getNoLeidas, getNotificaciones, marcarLeida, marcarTodasLeidas,
} from '@/lib/notifications-api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/store/auth';
import { formatFecha, formatHora, formatDiaMes } from '@/lib/tiempo';

export function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const count = useQuery({ queryKey: ['notif-count'], queryFn: getNoLeidas });
  const lista = useQuery({ queryKey: ['notificaciones'], queryFn: getNotificaciones, enabled: open });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['notif-count'] });
    qc.invalidateQueries({ queryKey: ['notificaciones'] });
  };

  // Conexión WebSocket: refresca al recibir una notificación en tiempo real
  useEffect(() => {
    const token = useAuth.getState().accessToken;
    if (!token) return;
    const s = connectSocket(token);
    const onNotif = () => refrescar();
    s.on('notificacion', onNotif);
    return () => { s.off('notificacion', onNotif); disconnectSocket(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const marcar = useMutation({ mutationFn: (id: string) => marcarLeida(id), onSuccess: refrescar });
  const marcarTodas = useMutation({ mutationFn: () => marcarTodasLeidas(), onSuccess: refrescar });

  const noLeidas = count.data ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">Notificaciones</span>
            {noLeidas > 0 && (
              <button onClick={() => marcarTodas.mutate()} className="flex items-center gap-1 text-xs text-brand hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {lista.data?.length ? (
              lista.data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.leida && marcar.mutate(n.id)}
                  className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${n.leida ? '' : 'bg-brand/5'}`}
                >
                  {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  <div className={n.leida ? 'pl-5' : ''}>
                    <p className="text-sm text-slate-700">{n.mensaje}</p>
                    {n.fechaFin && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                        <CalendarClock className="h-3 w-3" /> Entrega: {formatDiaMes(n.fechaFin)}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs capitalize text-slate-400">
                      {formatFecha(n.createdAt)} {formatHora(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                {lista.isLoading ? 'Cargando…' : 'No tienes notificaciones.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Trash2, Paperclip, Download, KeyRound } from 'lucide-react';
import {
  actualizarTrabajador, descargarContrato, eliminarTrabajador, subirContrato,
  type Rol, type Trabajador,
} from '@/lib/trabajadores-api';
import { errorMessage } from '@/lib/auth-api';
import { Button, Input, Select } from '@/components/ui';

export function TrabajadorModal({ trabajador, onClose }: { trabajador: Trabajador; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(trabajador.nombre);
  const [rol, setRol] = useState<Rol>(trabajador.rol);
  const [dni, setDni] = useState(trabajador.dni ?? '');
  const [telefono, setTelefono] = useState(trabajador.telefono ?? '');
  const [puesto, setPuesto] = useState(trabajador.puesto ?? '');
  const [enPracticas, setEnPracticas] = useState(trabajador.enPracticas);
  const [activo, setActivo] = useState(trabajador.activo);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const refrescar = () => qc.invalidateQueries({ queryKey: ['trabajadores'] });

  const guardar = useMutation({
    mutationFn: () => actualizarTrabajador(trabajador.id, {
      nombre, rol, dni, telefono, puesto, enPracticas, activo,
      ...(password ? { password } : {}),
    }),
    onSuccess: () => { refrescar(); onClose(); },
    onError: (e) => setError(errorMessage(e)),
  });
  const borrar = useMutation({
    mutationFn: () => eliminarTrabajador(trabajador.id),
    onSuccess: () => { refrescar(); onClose(); },
    onError: (e) => setError(errorMessage(e)),
  });
  const subir = useMutation({
    mutationFn: (f: File) => subirContrato(trabajador.id, f),
    onSuccess: () => { setMsg('Contrato subido ✓'); refrescar(); setTimeout(() => setMsg(''), 2000); },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{trabajador.nombre}</h3>
            <p className="text-xs text-slate-400">{trabajador.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Nombre</label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Rol</label>
              <Select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
                <option value="TRABAJADOR">Trabajador</option>
                <option value="ADMIN">Administrador</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">DNI</label>
              <Input value={dni} onChange={(e) => setDni(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Teléfono</label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Puesto</label>
              <Input value={puesto} onChange={(e) => setPuesto(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={enPracticas} onChange={(e) => setEnPracticas(e.target.checked)} className="accent-brand" />
              En prácticas
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="accent-brand" />
              Activo
            </label>
          </div>

          {/* Contrato */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-xs font-medium uppercase text-slate-400">Contrato</p>
            <div className="flex items-center gap-2 text-sm">
              {trabajador.contratoNombre ? (
                <>
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  <span className="truncate text-slate-700">{trabajador.contratoNombre}</span>
                  <button onClick={() => descargarContrato(trabajador.id, trabajador.contratoNombre!)} className="ml-auto text-slate-400 hover:text-brand" title="Descargar">
                    <Download className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <span className="text-slate-400">Sin contrato adjunto.</span>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }} />
            <Button variant="ghost" className="mt-2" onClick={() => fileRef.current?.click()} disabled={subir.isPending}>
              <Paperclip className="mr-1 h-4 w-4" /> {subir.isPending ? 'Subiendo…' : (trabajador.contratoNombre ? 'Reemplazar' : 'Adjuntar contrato')}
            </Button>
            {msg && <p className="mt-1 text-xs text-emerald-600">{msg}</p>}
          </div>

          {/* Reset contraseña */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <KeyRound className="h-3.5 w-3.5" /> Restablecer contraseña (opcional)
            </label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña (mín. 8)" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => borrar.mutate()} disabled={borrar.isPending} className="text-red-600 hover:bg-red-50">
            <Trash2 className="mr-1 h-4 w-4" /> Eliminar
          </Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || !nombre.trim()}>
            <Save className="mr-1 h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

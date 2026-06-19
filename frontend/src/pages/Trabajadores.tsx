import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X, GraduationCap } from 'lucide-react';
import {
  crearTrabajador, getTrabajadores, type Rol, type Trabajador,
} from '@/lib/trabajadores-api';
import { errorMessage } from '@/lib/auth-api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Select } from '@/components/ui';
import { TrabajadorModal } from '@/components/trabajadores/TrabajadorModal';

export function Trabajadores() {
  const [abierto, setAbierto] = useState<Trabajador | null>(null);
  const [creando, setCreando] = useState(false);
  const trabajadores = useQuery({ queryKey: ['trabajadores'], queryFn: getTrabajadores });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Trabajadores" subtitle="Fichas de empleado y cuentas de acceso." />
        <Button onClick={() => setCreando(true)}>
          <UserPlus className="mr-1 h-4 w-4" /> Nuevo trabajador
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Puesto</th>
              <th className="px-4 py-2.5 font-medium">Rol</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trabajadores.data?.map((t) => (
              <tr key={t.id} onClick={() => setAbierto(t)} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
                      {t.nombre.charAt(0).toUpperCase()}
                    </span>
                    {t.nombre}
                    {t.enPracticas && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        <GraduationCap className="h-3 w-3" /> Prácticas
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{t.email}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.puesto || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.rol === 'ADMIN' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-600'}`}>
                    {t.rol === 'ADMIN' ? 'Administrador' : 'Trabajador'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {t.activo
                    ? <span className="text-emerald-600">Activo</span>
                    : <span className="text-slate-400">Inactivo</span>}
                </td>
              </tr>
            ))}
            {trabajadores.data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aún no hay trabajadores.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {abierto && <TrabajadorModal trabajador={abierto} onClose={() => setAbierto(null)} />}
      {creando && <NuevoTrabajadorModal onClose={() => setCreando(false)} />}
    </div>
  );
}

function NuevoTrabajadorModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('TRABAJADOR');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [puesto, setPuesto] = useState('');
  const [enPracticas, setEnPracticas] = useState(false);
  const [error, setError] = useState('');

  const crear = useMutation({
    mutationFn: () => crearTrabajador({
      nombre: nombre.trim(), email: email.trim(), password, rol,
      dni: dni || undefined, telefono: telefono || undefined, puesto: puesto || undefined, enPracticas,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trabajadores'] }); onClose(); },
    onError: (e) => setError(errorMessage(e)),
  });

  const valido = nombre.trim() && email.trim() && password.length >= 8;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-base font-semibold text-slate-900">Nuevo trabajador</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Nombre *</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Contraseña * (mín. 8)</label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Puesto</label>
            <Input value={puesto} onChange={(e) => setPuesto(e.target.value)} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={enPracticas} onChange={(e) => setEnPracticas(e.target.checked)} className="accent-brand" />
            Persona en prácticas
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => valido && crear.mutate()} disabled={crear.isPending || !valido}>
            <UserPlus className="mr-1 h-4 w-4" /> Crear cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}

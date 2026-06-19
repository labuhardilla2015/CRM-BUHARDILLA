import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Trash2, Camera, KeyRound, Paperclip, Download, Upload,
} from 'lucide-react';
import {
  actualizarTrabajador, descargarDocumentoEmpleado, eliminarDocumentoEmpleado, eliminarTrabajador,
  getDocumentosEmpleado, getFotoUrl, getTrabajador, subirDocumentoEmpleado, subirFoto,
  type Rol,
} from '@/lib/trabajadores-api';
import { errorMessage } from '@/lib/auth-api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Input, Select } from '@/components/ui';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function TrabajadorPerfil() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const trabajador = useQuery({ queryKey: ['trabajador', id], queryFn: () => getTrabajador(id) });

  if (trabajador.isLoading || !trabajador.data) {
    return <div className="p-8 text-sm text-slate-400">Cargando perfil…</div>;
  }
  const t = trabajador.data;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/trabajadores" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={t.nombre} subtitle={t.email} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Columna izquierda: foto */}
        <FotoCard id={id} tieneFoto={!!t.fotoRuta} nombre={t.nombre} onChange={() => qc.invalidateQueries({ queryKey: ['trabajador', id] })} />

        {/* Columna derecha: datos + documentos */}
        <div className="space-y-6">
          <DatosCard
            id={id}
            inicial={{ nombre: t.nombre, rol: t.rol, dni: t.dni ?? '', telefono: t.telefono ?? '', puesto: t.puesto ?? '', enPracticas: t.enPracticas, activo: t.activo }}
            onSaved={() => qc.invalidateQueries({ queryKey: ['trabajador', id] })}
            onDeleted={() => navigate('/trabajadores')}
          />
          <DocumentosCard id={id} />
        </div>
      </div>
    </div>
  );
}

function FotoCard({ id, tieneFoto, nombre, onChange }: { id: string; tieneFoto: boolean; nombre: string; onChange: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const foto = useQuery({
    queryKey: ['foto', id, tieneFoto],
    queryFn: () => getFotoUrl(id),
    enabled: tieneFoto,
  });
  const subir = useMutation({ mutationFn: (f: File) => subirFoto(id, f), onSuccess: onChange });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
      <div className="mx-auto mb-4 grid h-40 w-40 place-items-center overflow-hidden rounded-full bg-brand/10">
        {foto.data ? (
          <img src={foto.data} alt={nombre} className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl font-semibold text-brand">{nombre.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }} />
      <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={subir.isPending}>
        <Camera className="mr-1 h-4 w-4" /> {subir.isPending ? 'Subiendo…' : 'Cambiar foto'}
      </Button>
    </div>
  );
}

function DatosCard({
  id, inicial, onSaved, onDeleted,
}: {
  id: string;
  inicial: { nombre: string; rol: Rol; dni: string; telefono: string; puesto: string; enPracticas: boolean; activo: boolean };
  onSaved: () => void; onDeleted: () => void;
}) {
  const [f, setF] = useState(inicial);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const guardar = useMutation({
    mutationFn: () => actualizarTrabajador(id, { ...f, ...(password ? { password } : {}) }),
    onSuccess: () => { setPassword(''); setOk(true); setTimeout(() => setOk(false), 2000); onSaved(); },
    onError: (e) => setError(errorMessage(e)),
  });
  const borrar = useMutation({ mutationFn: () => eliminarTrabajador(id), onSuccess: onDeleted, onError: (e) => setError(errorMessage(e)) });

  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Datos del empleado</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">Nombre</label>
          <Input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Rol</label>
          <Select value={f.rol} onChange={(e) => set('rol', e.target.value)}>
            <option value="TRABAJADOR">Trabajador</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">DNI</label>
          <Input value={f.dni} onChange={(e) => set('dni', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Teléfono</label>
          <Input value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Puesto</label>
          <Input value={f.puesto} onChange={(e) => set('puesto', e.target.value)} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={f.enPracticas} onChange={(e) => set('enPracticas', e.target.checked)} className="accent-brand" /> En prácticas
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} className="accent-brand" /> Activo
        </label>
      </div>

      <div className="mt-3">
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
          <KeyRound className="h-3.5 w-3.5" /> Restablecer contraseña (opcional)
        </label>
        <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña (mín. 8)" />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => borrar.mutate()} disabled={borrar.isPending} className="text-red-600 hover:bg-red-50">
          <Trash2 className="mr-1 h-4 w-4" /> Eliminar
        </Button>
        <div className="flex items-center gap-3">
          {ok && <span className="text-sm text-emerald-600">Guardado ✓</span>}
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || !f.nombre.trim()}>
            <Save className="mr-1 h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentosCard({ id }: { id: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const docs = useQuery({ queryKey: ['docs-empleado', id], queryFn: () => getDocumentosEmpleado(id) });
  const refrescar = () => qc.invalidateQueries({ queryKey: ['docs-empleado', id] });

  const subir = useMutation({ mutationFn: (f: File) => subirDocumentoEmpleado(id, f), onSuccess: refrescar });
  const borrar = useMutation({ mutationFn: (docId: string) => eliminarDocumentoEmpleado(id, docId), onSuccess: refrescar });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Documentos (contratos, DNI, etc.)</h3>
      <ul className="space-y-1">
        {docs.data?.length === 0 && <li className="text-sm text-slate-400">Sin documentos.</li>}
        {docs.data?.map((d) => (
          <li key={d.id} className="group flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-slate-700">{d.nombre}</span>
            <span className="text-xs text-slate-400">{formatBytes(d.tamano)}</span>
            <button onClick={() => descargarDocumentoEmpleado(id, d.id, d.nombre)} className="ml-auto text-slate-400 hover:text-brand" title="Descargar">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={() => borrar.mutate(d.id)} className="text-slate-300 hover:text-red-600" title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subir.mutate(f); e.target.value = ''; }} />
      <Button variant="ghost" className="mt-2" onClick={() => fileRef.current?.click()} disabled={subir.isPending}>
        <Upload className="mr-1 h-4 w-4" /> {subir.isPending ? 'Subiendo…' : 'Subir documento'}
      </Button>
    </div>
  );
}

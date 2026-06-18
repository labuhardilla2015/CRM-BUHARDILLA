import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, errorMessage } from '@/lib/auth-api';
import { Button, Input, Label } from '@/components/ui';
import { AuthShell } from './Login';

export function Register() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(nombre, email, password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'No se pudo completar el registro'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="CRM · La Buhardilla del Marketing">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}

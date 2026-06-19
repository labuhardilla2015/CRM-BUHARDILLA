import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, errorMessage } from '@/lib/auth-api';
import { Button, Input, Label } from '@/components/ui';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="CRM · La Buhardilla del Marketing">
      <form onSubmit={onSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-brand hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center bg-white px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
        <div className="flex flex-col items-center bg-sidebar px-8 py-7">
          <img src="/logo.png" alt="La Buhardilla" className="h-12 w-auto" />
        </div>
        <div className="p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

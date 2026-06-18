import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, PanelLeftClose } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { logout } from '@/lib/auth-api';
import { NAV_ITEMS, type NavItem } from '@/config/nav';
import { cn } from '@/lib/cn';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const usuario = useAuth((s) => s.usuario)!;

  const visibles = NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(usuario.rol));

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Marca */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">La Buhardilla</p>
          <p className="text-xs text-slate-400">CRM interno</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 lg:hidden">
            <PanelLeftClose className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {visibles.map((item) => (
          <NavEntry key={item.to} item={item} onNavigate={onClose} />
        ))}
      </nav>

      {/* Usuario + salir */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{usuario.nombre}</p>
            <p className="text-xs text-slate-400">{usuario.rol}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const location = useLocation();
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const isSectionActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
  const [open, setOpen] = useState(isSectionActive);

  const baseLink =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition';

  if (!hasChildren) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/'}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(baseLink, isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100')
        }
      >
        <Icon className="h-5 w-5 shrink-0" />
        {item.label}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          baseLink,
          'w-full justify-between',
          isSectionActive ? 'text-brand' : 'text-slate-600 hover:bg-slate-100',
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" />
          {item.label}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 space-y-1 pl-11">
          {item.children!.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-1.5 text-sm transition',
                  isActive ? 'bg-brand/10 font-medium text-brand' : 'text-slate-500 hover:bg-slate-100',
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

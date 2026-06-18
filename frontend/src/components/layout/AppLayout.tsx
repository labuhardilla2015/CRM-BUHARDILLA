import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/cn';

/**
 * Estructura principal de la app autenticada: sidebar fijo en escritorio y
 * deslizable en móvil, con el contenido del módulo en el área principal.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar móvil (slide-over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior solo en móvil para abrir el menú */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold">La Buhardilla · CRM</span>
        </header>

        <main className={cn('flex-1 overflow-y-auto')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

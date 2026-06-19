import {
  LayoutDashboard,
  Clock,
  Users,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { Rol } from '@/types';

export interface NavChild {
  to: string;
  label: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Si se indica, solo estos roles ven la entrada. Si no, todos. */
  roles?: Rol[];
  /** Sub-secciones (p. ej. el submenú del Reloj). */
  children?: NavChild[];
}

/**
 * Definición única de la navegación lateral. Cada módulo se añade aquí a
 * medida que avanza el roadmap por fases.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Inicio',
    icon: LayoutDashboard,
  },
  {
    to: '/reloj',
    label: 'Reloj',
    icon: Clock,
    children: [
      { to: '/reloj/fichaje', label: 'Fichaje' },
      { to: '/reloj/cronometro', label: 'Cronómetro' },
      { to: '/reloj/calendario', label: 'Calendario' },
      { to: '/reloj/informes', label: 'Informes' },
    ],
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: Users,
  },
  {
    to: '/potenciales',
    label: 'Potenciales',
    icon: Target,
    roles: ['ADMIN'],
  },
];

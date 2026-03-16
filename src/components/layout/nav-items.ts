import {
  LayoutDashboard,
  MessageSquare,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  Target,
  BarChart3,
  Landmark,
  Grid3X3,
  Crosshair,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  pro?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Organização',
    items: [
      { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Fluxo de Caixa', href: '/cashflow', icon: CalendarDays },
      { label: 'Recorrentes', href: '/subscriptions', icon: Repeat, pro: true },
    ],
  },
  {
    title: 'Controle Financeiro',
    items: [
      { label: 'Contas', href: '/accounts', icon: Landmark },
      { label: 'Categorias', href: '/categories', icon: Grid3X3 },
      { label: 'Metas', href: '/goals', icon: Crosshair, pro: true },
    ],
  },
  {
    title: 'Visão Estratégica',
    items: [
      { label: 'Projeções', href: '/projections', icon: TrendingUp, pro: true },
      { label: 'Patrimônio', href: '/retirement', icon: Target, pro: true },
      { label: 'Relatórios', href: '/reports', icon: BarChart3, pro: true },
    ],
  },
];

// Flat list for backward compatibility (header mobile menu, bottom nav, etc.)
export const navItems: NavItem[] = navSections.flatMap((s) => s.items);

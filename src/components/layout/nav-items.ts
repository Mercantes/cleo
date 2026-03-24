import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
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
    title: 'Dia a dia',
    items: [
      { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Fluxo de Caixa', href: '/cashflow', icon: CalendarDays },
    ],
  },
  {
    title: 'Planejamento',
    items: [
      { label: 'Metas & Orçamentos', href: '/goals', icon: Crosshair, pro: true },
      { label: 'Futuro', href: '/projections', icon: TrendingUp, pro: true },
      { label: 'Relatórios', href: '/reports', icon: BarChart3, pro: true },
    ],
  },
];

// Flat list for backward compatibility (header mobile menu, bottom nav, etc.)
export const navItems: NavItem[] = navSections.flatMap((s) => s.items);

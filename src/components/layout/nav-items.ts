import {
  LayoutDashboard,
  MessageSquare,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  Target,
  Settings,
  BarChart3,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Contas', href: '/accounts', icon: Landmark },
  { label: 'Relatórios', href: '/reports', icon: BarChart3 },
  { label: 'Assinaturas', href: '/subscriptions', icon: Repeat },
  { label: 'Projeções', href: '/projections', icon: TrendingUp },
  { label: 'Aposentadoria', href: '/retirement', icon: Target },
  { label: 'Configurações', href: '/settings', icon: Settings },
];

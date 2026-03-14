import {
  LayoutDashboard,
  MessageSquare,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  Target,
  Settings,
  Users,
  Upload,
  BarChart3,
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
  { label: 'Dividir', href: '/splits', icon: Users },
  { label: 'Relatórios', href: '/reports', icon: BarChart3 },
  { label: 'Importar', href: '/import', icon: Upload },
  { label: 'Assinaturas', href: '/subscriptions', icon: Repeat },
  { label: 'Projeções', href: '/projections', icon: TrendingUp },
  { label: 'Aposentadoria', href: '/retirement', icon: Target },
  { label: 'Configurações', href: '/settings', icon: Settings },
];

import {
  LayoutDashboard,
  MessageSquare,
  ArrowLeftRight,
  TrendingUp,
  Settings,
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
  { label: 'Projeções', href: '/projections', icon: TrendingUp },
  { label: 'Configurações', href: '/settings', icon: Settings },
];

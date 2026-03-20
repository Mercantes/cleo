'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, ArrowLeftRight, CalendarDays, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const bottomNavItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat', href: '/chat', icon: MessageSquare, badge: true },
  { label: 'Transações', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Fluxo', href: '/cashflow', icon: CalendarDays },
  { label: 'Mais', href: '/settings', icon: Settings },
];

function useHasUnread(pathname: string) {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    try {
      if (pathname === '/chat') {
        sessionStorage.setItem('cleo_chat_visited', '1');
        return;
      }
    } catch {
      // sessionStorage unavailable
    }

    let visited: string | null = null;
    try {
      visited = sessionStorage.getItem('cleo_chat_visited');
    } catch {
      // sessionStorage unavailable
    }
    if (!visited) {
      fetch('/api/insights')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.insights?.length > 0) setHasUnread(true);
        })
        .catch(() => {});
    }
  }, [pathname]);

  return pathname === '/chat' ? false : hasUnread;
}

export function BottomNav() {
  const pathname = usePathname();
  const hasUnread = useHasUnread(pathname);

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background pb-safe md:hidden">
      <div className="flex h-[4.5rem] items-center justify-around">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const showBadge = item.badge && hasUnread && !isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import { useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { navItems } from '@/components/layout/nav-items';
import { UsageMeter } from './usage-meter';
import { SidebarBalance } from './sidebar-balance';

const STORAGE_KEY = 'cleo-sidebar-collapsed';

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('sidebar-toggle', handler);
  return () => window.removeEventListener('sidebar-toggle', handler);
}

export function toggleSidebar() {
  const current = localStorage.getItem(STORAGE_KEY) === 'true';
  localStorage.setItem(STORAGE_KEY, String(!current));
  window.dispatchEvent(new Event('sidebar-toggle'));
}

export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        'hidden flex-col border-r bg-background transition-all duration-200 md:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cn('flex h-14 items-center border-b', collapsed ? 'justify-center px-2' : 'px-6')}>
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <Image src="/logo.png" alt="Cleo" width={28} height={28} className="shrink-0 rounded-md" />
          {!collapsed && <span className="text-xl font-bold">Cleo</span>}
        </Link>
      </div>
      <nav aria-label="Menu do aplicativo" className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      {!collapsed && <SidebarBalance />}
      {!collapsed && <UsageMeter />}
    </aside>
  );
}

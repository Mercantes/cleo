'use client';

import { useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/components/layout/nav-items';
import { UsageMeter } from './usage-meter';
import { SidebarBalance } from './sidebar-balance';
import { signOut } from '@/lib/actions/auth';

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
          <Image src="/logo.png" alt="" width={28} height={28} className="shrink-0 rounded-md" />
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
      <div className="border-t p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => signOut()}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
              className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Atalhos do teclado"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Atalhos</span>
              <kbd className="ml-auto rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
              aria-label="Sair da conta"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

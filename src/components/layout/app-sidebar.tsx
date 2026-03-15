'use client';

import { useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Bug, HelpCircle, Crown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { navSections } from '@/components/layout/nav-items';
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
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b', collapsed ? 'justify-center px-2' : 'px-6')}>
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <Image src="/logo.png" alt="Cleo" width={28} height={28} className="shrink-0 rounded-md" />
          {!collapsed && <span className="text-xl font-bold">Cleo</span>}
        </Link>
      </div>

      {/* Chat - item destacado */}
      <div className={cn('px-3 pt-3', collapsed && 'px-2')}>
        <Link
          href="/chat"
          title={collapsed ? 'Pergunte à Cleo' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            collapsed && 'justify-center px-2',
            pathname === '/chat' || pathname.startsWith('/chat/')
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary hover:bg-primary/20',
          )}
        >
          <MessageSquare className="h-5 w-5 shrink-0" />
          {!collapsed && 'Pergunte à Cleo'}
        </Link>
      </div>

      {/* Grouped navigation */}
      <nav aria-label="Menu do aplicativo" className="flex-1 overflow-y-auto px-3 pt-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
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
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && (
                      <span className="flex flex-1 items-center justify-between">
                        {item.label}
                        {item.pro && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary">
                            PRO
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Balance */}
      {!collapsed && <SidebarBalance />}

      {/* Footer links */}
      <div className={cn('border-t', collapsed ? 'px-2 py-2' : 'px-3 py-2')}>
        {!collapsed ? (
          <div className="space-y-0.5">
            <a
              href="https://github.com/Mercantes/cleo/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bug className="h-4 w-4 shrink-0" />
              Feedback e Bugs
            </a>
            <Link
              href="/upgrade"
              className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Crown className="h-4 w-4 shrink-0" />
              Plano
            </Link>
            <Link
              href="/support"
              className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Suporte
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <a
              href="https://github.com/Mercantes/cleo/issues"
              target="_blank"
              rel="noopener noreferrer"
              title="Feedback e Bugs"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bug className="h-4 w-4" />
            </a>
            <Link
              href="/upgrade"
              title="Plano"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Crown className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/components/layout/nav-items';
import { UsageMeter } from './usage-meter';
import { signOut } from '@/lib/actions/auth';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside aria-label="Navegação principal" className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-xl font-bold">Cleo</span>
        </Link>
      </div>
      <nav aria-label="Menu do aplicativo" className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <UsageMeter />
      <div className="border-t p-3">
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
      </div>
    </aside>
  );
}

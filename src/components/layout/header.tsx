'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle, CreditCard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { navSections } from '@/components/layout/nav-items';
import { signOut } from '@/lib/actions/auth';
import { useTier, clearTierCache } from '@/hooks/use-tier';

import { PrivacyToggle } from '@/components/layout/privacy-toggle';
import { toggleSidebar, useSidebarCollapsed } from '@/components/layout/app-sidebar';
import { SettingsDialog } from '@/components/settings/settings-dialog';

interface HeaderProps {
  userName: string;
  avatarUrl?: string | null;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Visão Geral',
  '/chat': 'Pergunte à Cleo',
  '/transactions': 'Transações',
  '/projections': 'Futuro',
  '/retirement': 'Patrimônio',
  '/subscriptions': 'Recorrentes',
  '/onboarding': 'Configuração Inicial',
  '/upgrade': 'Plano',
  '/cashflow': 'Fluxo de Caixa',
  '/budgets': 'Orçamentos',
  '/challenges': 'Desafios',
  '/reports': 'Relatórios',
  '/import': 'Importar Extrato',
  '/categories': 'Categorias',
  '/goals': 'Metas',
  '/accounts': 'Contas',
  '/support': 'Suporte',
};

export function Header({ userName, avatarUrl }: HeaderProps) {
  const pathname = usePathname();
  const sidebarCollapsed = useSidebarCollapsed();
  const { isPro, isLoading: tierLoading, isInGracePeriod } = useTier();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pageTitle = pageTitles[pathname] || 'Cleo';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {isInGracePeriod && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Problema com seu pagamento.{' '}
            <Link href="/upgrade" className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100">
              Atualize seu método de pagamento
            </Link>{' '}
            para manter o plano Pro.
          </span>
        </div>
      )}
    <header className="flex h-14 items-center justify-between border-b px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="flex h-14 items-center gap-2 border-b px-6">
              <Image src="/logo.png" alt="Cleo" width={28} height={28} className="rounded-md" />
              <span className="text-xl font-bold">Cleo</span>
            </div>
            <nav aria-label="Menu principal" className="p-3">
              {navSections.map((section) => (
                <div key={section.title} className="mb-3">
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || (item.activeAlso?.some((r) => pathname === r || pathname.startsWith(r + '/')) ?? false);
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
                          <span className="flex flex-1 items-center justify-between">
                            {item.label}
                            {item.pro && !tierLoading && !isPro && (
                              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary">
                                PRO
                              </span>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <button
          onClick={toggleSidebar}
          className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Minimizar menu'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <h1 className="truncate text-base font-semibold md:text-lg">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1">
      <PrivacyToggle />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="flex cursor-pointer items-center gap-2" aria-label="Menu do usuário" />}
        >
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm md:inline-block">{userName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = '/upgrade'}>
            <CreditCard className="mr-2 h-4 w-4" />
            Planos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { clearTierCache(); signOut(); }}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
    </>
  );
}

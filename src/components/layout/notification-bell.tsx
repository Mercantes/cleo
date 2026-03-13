'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'celebration' | 'suggestion';
  icon: string;
  title: string;
  message: string;
}

const TYPE_STYLES: Record<string, string> = {
  warning: 'border-l-amber-500',
  tip: 'border-l-blue-500',
  celebration: 'border-l-green-500',
  suggestion: 'border-l-purple-500',
};

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.insights) setInsights(data.insights);
      })
      .catch(() => {});
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const visible = insights.filter((i) => !dismissed.has(i.id));
  const hasWarnings = visible.some((i) => i.type === 'warning');

  function handleDismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Notificações${visible.length > 0 ? ` (${visible.length})` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {visible.length > 0 && (
          <span
            className={cn(
              'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white',
              hasWarnings ? 'bg-amber-500' : 'bg-primary',
            )}
          >
            {visible.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-background shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {visible.length > 0 && (
              <button
                onClick={() => {
                  setDismissed(new Set(insights.map((i) => i.id)));
                }}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Limpar tudo
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl">🔔</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma notificação no momento
                </p>
              </div>
            ) : (
              visible.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'flex gap-3 border-b border-l-4 px-4 py-3 last:border-b-0',
                    TYPE_STYLES[insight.type] || 'border-l-muted',
                  )}
                >
                  <span className="mt-0.5 text-lg">{insight.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {insight.message}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {insight.type === 'warning' && (
                        <button
                          onClick={() => {
                            router.push('/chat?q=' + encodeURIComponent(`Analise meus gastos: ${insight.title}`));
                            setOpen(false);
                          }}
                          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                        >
                          Analisar com Cleo
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(insight.id)}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

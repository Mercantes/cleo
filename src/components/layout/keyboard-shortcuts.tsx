'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  Target,
  Settings,
  Sun,
  Moon,
  Download,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  section: string;
  icon: LucideIcon;
  shortcut?: string[];
  action: () => void;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    function navigate(path: string) {
      router.push(path);
      setOpen(false);
    }

    return [
      // Navigation
      { id: 'dashboard', label: 'Ir para Dashboard', section: 'Navegação', icon: LayoutDashboard, shortcut: ['⌘', 'D'], action: () => navigate('/dashboard') },
      { id: 'chat', label: 'Ir para Chat', section: 'Navegação', icon: MessageSquare, shortcut: ['⌘', 'C'], action: () => navigate('/chat') },
      { id: 'transactions', label: 'Ir para Transações', section: 'Navegação', icon: ArrowLeftRight, shortcut: ['⌘', 'T'], action: () => navigate('/transactions') },
      { id: 'subscriptions', label: 'Ir para Assinaturas', section: 'Navegação', icon: Repeat, action: () => navigate('/subscriptions') },
      { id: 'projections', label: 'Ir para Projeções', section: 'Navegação', icon: TrendingUp, shortcut: ['⌘', 'P'], action: () => navigate('/projections') },
      { id: 'retirement', label: 'Ir para Aposentadoria', section: 'Navegação', icon: Target, action: () => navigate('/retirement') },
      { id: 'settings', label: 'Ir para Configurações', section: 'Navegação', icon: Settings, shortcut: ['⌘', 'S'], action: () => navigate('/settings') },
      // Actions
      {
        id: 'theme',
        label: 'Alternar tema claro/escuro',
        section: 'Ações',
        icon: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? Sun : Moon,
        action: () => {
          const next = !document.documentElement.classList.contains('dark');
          document.documentElement.classList.toggle('dark', next);
          localStorage.setItem('cleo_theme', next ? 'dark' : 'light');
          setOpen(false);
        },
      },
      {
        id: 'refresh',
        label: 'Atualizar dados do dashboard',
        section: 'Ações',
        icon: RefreshCw,
        action: () => {
          navigate('/dashboard');
          setTimeout(() => window.dispatchEvent(new CustomEvent('cleo:refresh-dashboard')), 100);
        },
      },
      {
        id: 'export',
        label: 'Exportar transações (CSV)',
        section: 'Ações',
        icon: Download,
        action: () => {
          navigate('/transactions');
        },
      },
      // Quick chat
      {
        id: 'chat-ask',
        label: 'Perguntar à Cleo sobre finanças',
        section: 'Chat',
        icon: MessageSquare,
        action: () => navigate('/chat'),
      },
    ];
  }, [router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.section.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const existing = map.get(cmd.section);
      if (existing) existing.push(cmd);
      else map.set(cmd.section, [cmd]);
    }
    return map;
  }, [filtered]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Open/close with ⌘K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        // Allow ⌘K even in inputs
        if (e.key.toLowerCase() !== 'k') return;
      }

      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) setQuery('');
          return !prev;
        });
        return;
      }

      // Direct navigation shortcuts (only when palette is closed)
      const shortcutMap: Record<string, string> = {
        d: '/dashboard',
        c: '/chat',
        t: '/transactions',
        p: '/projections',
        s: '/settings',
      };
      if (shortcutMap[key] && !document.querySelector('[data-command-palette]')) {
        e.preventDefault();
        router.push(shortcutMap[key]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keyboard navigation inside palette
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      data-command-palette
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="mx-4 w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar comandos..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhum comando encontrado
            </p>
          ) : (
            [...grouped.entries()].map(([section, cmds]) => (
              <div key={section}>
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {section}
                </p>
                {cmds.map((cmd) => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      data-selected={isSelected}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground',
                      )}
                    >
                      <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="flex gap-1">
                          {cmd.shortcut.map((k) => (
                            <kbd
                              key={k}
                              className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

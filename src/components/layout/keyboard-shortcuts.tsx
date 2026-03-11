'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'D'], label: 'Dashboard', route: '/dashboard' },
  { keys: ['⌘', 'C'], label: 'Chat', route: '/chat' },
  { keys: ['⌘', 'T'], label: 'Transações', route: '/transactions' },
  { keys: ['⌘', 'P'], label: 'Projeções', route: '/projections' },
  { keys: ['⌘', 'S'], label: 'Configurações', route: '/settings' },
  { keys: ['⌘', 'K'], label: 'Abrir atalhos', route: '' },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      const shortcut = shortcuts.find((s) => s.route && s.keys[1].toLowerCase() === key);
      if (shortcut) {
        e.preventDefault();
        router.push(shortcut.route);
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (open) {
      function handleEsc(e: KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      }
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Atalhos do teclado"
        className="mx-4 w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Atalhos do teclado</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.label}
              onClick={() => {
                if (shortcut.route) {
                  router.push(shortcut.route);
                }
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <span>{shortcut.label}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Pressione <kbd className="rounded border bg-muted px-1 py-0.5 text-xs font-mono">Esc</kbd> para fechar
        </p>
      </div>
    </div>
  );
}

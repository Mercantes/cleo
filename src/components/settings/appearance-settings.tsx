'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('cleo_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'system';
}

function subscribe(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('storage', handler);
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => {
    window.removeEventListener('storage', handler);
    observer.disconnect();
  };
}

function applyTheme(theme: Theme) {
  if (theme === 'system') {
    localStorage.removeItem('cleo_theme');
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    localStorage.setItem('cleo_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function AppearanceSettings() {
  const current = useSyncExternalStore(subscribe, getStoredTheme, () => 'system' as Theme);

  const setTheme = useCallback((theme: Theme) => {
    applyTheme(theme);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Tema</h3>
        <p className="text-sm text-muted-foreground">Escolha como a Cleo aparece para você</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
              current === value
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-foreground/20'
            }`}
          >
            <Icon className={`h-5 w-5 ${current === value ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-medium ${current === value ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

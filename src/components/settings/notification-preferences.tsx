'use client';

import { useState, useSyncExternalStore } from 'react';

interface NotificationPrefs {
  weeklySummary: boolean;
  unusualSpending: boolean;
  subscriptionReminders: boolean;
}

const STORAGE_KEY = 'cleo_notification_prefs';

const defaultPrefs: NotificationPrefs = {
  weeklySummary: true,
  unusualSpending: true,
  subscriptionReminders: true,
};

function getStoredPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return defaultPrefs;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultPrefs;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultPrefs;
  }
}

const subscribe = () => () => {};

export function NotificationPreferences() {
  const initialPrefs = useSyncExternalStore(subscribe, getStoredPrefs, () => defaultPrefs);
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);

  const toggle = (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const items = [
    { key: 'weeklySummary' as const, label: 'Resumo semanal', desc: 'Receba um resumo dos seus gastos toda segunda-feira' },
    { key: 'unusualSpending' as const, label: 'Gastos incomuns', desc: 'Alertas quando detectamos gastos fora do padrão' },
    { key: 'subscriptionReminders' as const, label: 'Lembrete de assinaturas', desc: 'Aviso antes de cobranças recorrentes' },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <button
            role="switch"
            aria-checked={prefs[item.key]}
            aria-label={item.label}
            onClick={() => toggle(item.key)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              prefs[item.key] ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

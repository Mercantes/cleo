'use client';

import { useState, useSyncExternalStore } from 'react';

interface NotificationPrefs {
  weeklySummary: boolean;
  unusualSpending: boolean;
  subscriptionReminders: boolean;
  goalAlerts: boolean;
  challengeReminders: boolean;
}

const STORAGE_KEY = 'cleo_notification_prefs';

const defaultPrefs: NotificationPrefs = {
  weeklySummary: true,
  unusualSpending: true,
  subscriptionReminders: true,
  goalAlerts: true,
  challengeReminders: true,
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
    { key: 'goalAlerts' as const, label: 'Alertas de metas', desc: 'Acompanhe o progresso das suas metas de economia' },
    { key: 'challengeReminders' as const, label: 'Lembretes de desafios', desc: 'Notificações sobre desafios ativos e conquistas' },
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
            className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              prefs[item.key] ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

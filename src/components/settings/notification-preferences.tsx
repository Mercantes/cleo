'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { subscribeToPush, unsubscribeFromPush, isPushSupported, getPushPermission } from '@/lib/push/register-sw';

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
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    isPushSupported().then(setPushSupported);
    getPushPermission().then(setPushPermission);
  }, []);

  const toggle = (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast(updated[key] ? 'Notificação ativada' : 'Notificação desativada');
  };

  async function handlePushToggle() {
    setPushLoading(true);
    try {
      if (pushPermission === 'granted') {
        await unsubscribeFromPush();
        setPushPermission('default');
        toast('Notificações push desativadas');
      } else {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission === 'granted') {
          await subscribeToPush();
          toast('Notificações push ativadas!');
        } else {
          toast('Permissão de notificação negada');
        }
      }
    } catch {
      toast('Erro ao configurar notificações push');
    } finally {
      setPushLoading(false);
    }
  }

  const items = [
    { key: 'weeklySummary' as const, label: 'Resumo semanal', desc: 'Receba um resumo dos seus gastos toda segunda-feira' },
    { key: 'unusualSpending' as const, label: 'Gastos incomuns', desc: 'Alertas quando detectamos gastos fora do padrão' },
    { key: 'subscriptionReminders' as const, label: 'Lembrete de assinaturas', desc: 'Aviso antes de cobranças recorrentes' },
    { key: 'goalAlerts' as const, label: 'Alertas de metas', desc: 'Acompanhe o progresso das suas metas de economia' },
    { key: 'challengeReminders' as const, label: 'Lembretes de desafios', desc: 'Notificações sobre desafios ativos e conquistas' },
  ];

  return (
    <div className="space-y-4">
      {/* Push notification toggle */}
      {pushSupported && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pushPermission === 'granted' ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Notificações push</p>
                <p className="text-xs text-muted-foreground">
                  {pushPermission === 'granted'
                    ? 'Ativadas — você receberá alertas mesmo com o app fechado'
                    : pushPermission === 'denied'
                      ? 'Bloqueadas pelo navegador — altere nas configurações do navegador'
                      : 'Receba alertas de gastos, metas e resumos semanais'}
                </p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushLoading || pushPermission === 'denied'}
              className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${
                pushPermission === 'granted' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  pushPermission === 'granted' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'celebration' | 'suggestion';
  icon: string;
  title: string;
  message: string;
}

const typeStyles = {
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  tip: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  celebration: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  suggestion: 'border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100',
};

const DISMISSED_KEY = 'cleo_dismissed_insights';

function getDismissedFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    // Only keep dismissals from today
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) return new Set();
    return new Set(parsed.ids || []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify({ date: today, ids: [...ids] }));
}

export function InsightsBar() {
  const router = useRouter();
  const { data, isLoading: loading } = useApi<{ insights: Insight[] }>('/api/insights');
  const insights = data?.insights || [];
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedFromStorage());

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set([...prev, id]);
      saveDismissed(next);
      return next;
    });
  };

  const visible = insights.filter((i) => !dismissed.has(i.id));

  if (loading || visible.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visible.length > 1 && (
        <p className="text-[10px] font-medium text-muted-foreground">
          {visible.length} insight{visible.length > 1 ? 's' : ''} para você
        </p>
      )}
      {visible.map((insight, idx) => (
        <div
          key={insight.id}
          className={`flex items-start gap-3 rounded-lg border p-3 ${typeStyles[insight.type]} ${idx === 0 ? 'ring-1 ring-primary/20' : ''}`}
        >
          <span className="mt-0.5 text-lg leading-none">{insight.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{insight.title}</p>
            <p className="mt-0.5 text-xs opacity-80">{insight.message}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => router.push(`/chat?q=${encodeURIComponent(insight.title)}`)}
              aria-label={`Perguntar sobre: ${insight.title}`}
              className="rounded-md p-2 opacity-50 transition-opacity hover:opacity-100"
              title="Perguntar para a Cleo"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => dismiss(insight.id)}
              aria-label={`Dispensar: ${insight.title}`}
              className="rounded-md p-2 opacity-50 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

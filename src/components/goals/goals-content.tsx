'use client';

import { useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Crosshair, Flame, Trophy, Star, TrendingUp, Pencil, Share2, Check, X } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/components/ui/toast';

const BarChart = dynamic(
  () => import('recharts').then((m) => m.BarChart),
  { ssr: false },
);
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const ReferenceLine = dynamic(
  () => import('recharts').then((m) => m.ReferenceLine),
  { ssr: false },
);
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });

interface GoalsData {
  goals: { monthly_savings_target: number; retirement_age_target: number } | null;
  progress: {
    currentSavings: number;
    target: number;
    percentage: number;
    income: number;
    expenses: number;
  };
  gamification: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    streak: number;
    bestStreak: number;
    totalChallengesCompleted: number;
  };
}

interface StreakData {
  months: { month: string; savings: number; metGoal: boolean }[];
  currentStreak: number;
  bestStreak: number;
  target: number;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatInputValue(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function GoalsContent() {
  const { data, isLoading, mutate } = useApi<GoalsData>('/api/goals');
  const { data: streak } = useApi<StreakData>('/api/goals/streak');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasGoal = data?.goals?.monthly_savings_target && data.goals.monthly_savings_target > 0;

  function startEditing() {
    const current = data?.goals?.monthly_savings_target || 0;
    setEditValue(current > 0 ? formatInputValue(current) : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function cancelEditing() {
    setEditing(false);
    setEditValue('');
  }

  async function saveGoal() {
    const value = parseCurrencyInput(editValue);
    if (value <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlySavingsTarget: value }),
      });
      if (!res.ok) throw new Error();
      mutate();
      setEditing(false);
      toast.success('Meta atualizada!');
    } catch {
      toast.error('Não foi possível salvar a meta.');
    } finally {
      setSaving(false);
    }
  }

  const chartData = useMemo(() => {
    if (!streak?.months) return [];
    return streak.months.map((m) => ({
      month: m.month,
      savings: m.savings,
      metGoal: m.metGoal,
    }));
  }, [streak]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!hasGoal) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-12 text-center">
        <Crosshair className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <p className="text-lg font-semibold">Defina sua meta de economia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure quanto você quer economizar por mês para acompanhar seu progresso aqui.
          </p>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">R$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveGoal();
                if (e.key === 'Escape') cancelEditing();
              }}
              placeholder="4.000,00"
              className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm"
            />
            <button
              onClick={saveGoal}
              disabled={saving}
              className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Salvar
            </button>
            <button
              onClick={cancelEditing}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" />
            Configurar Meta
          </button>
        )}
      </div>
    );
  }

  const progress = data!.progress;
  const gam = data!.gamification;
  const xpPercent = Math.round((gam.xp / gam.xpToNextLevel) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            const text = `Atingi ${progress.percentage}% da minha meta de economia este mês! 💰`;
            if (navigator.share) {
              navigator.share({ title: 'Minha Meta - Cleo', text }).catch(() => {});
            } else {
              navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('share-toast');
                if (btn) { btn.textContent = 'Copiado!'; setTimeout(() => { btn.textContent = 'Compartilhar'; }, 2000); }
              });
            }
          }}
          id="share-toast"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
        <button
          onClick={startEditing}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Pencil className="h-4 w-4" />
          Editar Meta
        </button>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <span className="text-sm font-medium text-muted-foreground">Meta mensal: R$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveGoal();
              if (e.key === 'Escape') cancelEditing();
            }}
            placeholder="4.000,00"
            className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            onClick={saveGoal}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Salvar
          </button>
          <button
            onClick={cancelEditing}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Progress card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Economia este mês</p>
            <p className="mt-1 text-3xl font-bold">{fmt(progress.currentSavings)}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              de {fmt(progress.target)} ({progress.percentage}%)
            </p>
          </div>
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border-4"
            style={{
              borderColor: progress.percentage >= 100 ? '#10B981' : progress.percentage >= 50 ? '#F59E0B' : '#EF4444',
            }}
          >
            <span className="text-xl font-bold">{progress.percentage}%</span>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, progress.percentage)}%`,
              backgroundColor: progress.percentage >= 100 ? '#10B981' : progress.percentage >= 50 ? '#F59E0B' : '#EF4444',
            }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
          <span>Receita: {fmt(progress.income)}</span>
          <span>Despesas: {fmt(progress.expenses)}</span>
        </div>
        {progress.percentage < 100 && (() => {
          const remaining = progress.target - progress.currentSavings;
          const now2 = new Date();
          const daysInMonth = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate();
          const daysLeft = daysInMonth - now2.getDate();
          if (remaining > 0 && daysLeft > 0) {
            const perDay = remaining / daysLeft;
            return (
              <p className="mt-2 text-xs text-muted-foreground">
                Faltam {fmt(remaining)} — {fmt(perDay)}/dia nos próximos {daysLeft} dias
              </p>
            );
          }
          return null;
        })()}
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-2xl font-bold">{gam.streak}</p>
            <p className="text-xs text-muted-foreground">Sequência atual</p>
            {gam.streak > 0 && gam.streak >= gam.bestStreak && (
              <p className="text-[10px] font-medium text-orange-500">Recorde pessoal!</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">{gam.bestStreak}</p>
            <p className="text-xs text-muted-foreground">Melhor sequência</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Star className="h-8 w-8 text-purple-500" />
          <div>
            <p className="text-2xl font-bold">Nível {gam.level}</p>
            <p className="text-xs text-muted-foreground">{gam.xp}/{gam.xpToNextLevel} XP</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{gam.totalChallengesCompleted}</p>
            <p className="text-xs text-muted-foreground">Desafios completos</p>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso do Nível {gam.level}</span>
          <span className="text-muted-foreground">{gam.xp} / {gam.xpToNextLevel} XP</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {/* Streak chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Histórico de Economia (12 meses)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" className="fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis
                  className="fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [fmt(Number(v)), 'Economia']}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                {streak?.target && streak.target > 0 && (
                  <ReferenceLine
                    y={streak.target}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    label={{ value: 'Meta', position: 'right', fontSize: 11, fill: '#F59E0B' }}
                  />
                )}
                <Bar
                  dataKey="savings"
                  radius={[4, 4, 0, 0]}
                  fill="#3B82F6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

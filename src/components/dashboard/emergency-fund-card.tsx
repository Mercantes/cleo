'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldAlert, TrendingUp, Sparkles, ChevronDown, Target, Pencil, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import { CardInfoTip } from './card-info-tip';
import type { TrendMonth } from '@/types/dashboard';

interface AccountsData {
  totalBalance: number;
  bankTotal: number;
}

interface SummaryData {
  expenses: number;
  income: number;
  savingsRate: number;
}

interface GoalsData {
  goals: {
    emergency_fund_balance: number | null;
  } | null;
}

interface TrendsData {
  months: TrendMonth[];
}

function computeMonthlyAverages(trends: TrendMonth[] | undefined, currentExpenses: number, currentIncome: number) {
  if (!trends || trends.length === 0) {
    return { avgExpenses: currentExpenses, avgIncome: currentIncome, monthsUsed: 1 };
  }

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const months: { expenses: number; income: number }[] = [];

  for (const m of trends) {
    if (m.month === currentMonthKey) {
      if (monthProgress >= 0.5 && currentExpenses > 0) {
        months.push({
          expenses: Math.round(currentExpenses / monthProgress),
          income: Math.round(currentIncome / monthProgress),
        });
      }
    } else if (m.expenses > 0) {
      months.push({ expenses: m.expenses, income: m.income });
    }
  }

  if (months.length === 0) {
    return { avgExpenses: currentExpenses, avgIncome: currentIncome, monthsUsed: 1 };
  }

  const avgExpenses = Math.round(months.reduce((s, m) => s + m.expenses, 0) / months.length);
  const avgIncome = Math.round(months.reduce((s, m) => s + m.income, 0) / months.length);

  return { avgExpenses, avgIncome, monthsUsed: months.length };
}

const TARGET_OPTIONS = [3, 6, 9, 12] as const;
const STORAGE_KEY = 'cleo-emergency-target';

function getStoredTarget(): number {
  if (typeof window === 'undefined') return 6;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const n = Number(v);
    if (TARGET_OPTIONS.includes(n as typeof TARGET_OPTIONS[number])) return n;
  } catch {
    // ignore
  }
  return 6;
}

function formatMonthsCovered(months: number, hide: boolean): string {
  if (hide) return HIDDEN_VALUE;
  if (months >= 1) {
    const floored = Math.floor(months);
    return `${floored} ${floored === 1 ? 'mês' : 'meses'}`;
  }
  const days = Math.round(months * 30);
  if (days <= 0) return '< 1 dia';
  if (days < 7) return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  const weeks = Math.round(months * 4.3);
  return `~${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatTimeToGoal(months: number): string {
  if (months <= 0) return '—';
  if (months <= 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years}a ${remaining}m`;
}

export function EmergencyFundCard() {
  const [hideValues] = useHideValues();
  const [targetMonths, setTargetMonths] = useState(getStoredTarget);
  const [showSelector, setShowSelector] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const { data: accounts } = useApi<AccountsData>('/api/dashboard/accounts');
  const { data: summary } = useApi<SummaryData>('/api/dashboard/summary');
  const { data: goalsData, mutate: mutateGoals } = useApi<GoalsData>('/api/goals');
  const { data: trendsData } = useApi<TrendsData>('/api/dashboard/trends');

  const bankTotal = accounts?.bankTotal || 0;
  const userDefinedBalance = goalsData?.goals?.emergency_fund_balance;
  const balance = userDefinedBalance != null ? userDefinedBalance : bankTotal;
  const hasCustomBalance = userDefinedBalance != null;

  const { avgExpenses: monthlyExpenses, avgIncome: monthlyIncome, monthsUsed } = computeMonthlyAverages(
    trendsData?.months,
    summary?.expenses || 0,
    summary?.income || 0,
  );

  function handleTargetChange(months: number) {
    setTargetMonths(months);
    setShowSelector(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(months));
    } catch {
      // ignore
    }
  }

  function startEditing() {
    setEditValue(balance > 0 ? balance.toFixed(2).replace('.', ',') : '');
    setEditing(true);
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
    setEditValue('');
  }, []);

  async function saveBalance() {
    const value = parseCurrencyInput(editValue);
    if (value < 0) return;

    setSaving(true);
    try {
      await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyFundBalance: value || null }),
      });
      mutateGoals();
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  async function resetToAutomatic() {
    setSaving(true);
    try {
      await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyFundBalance: null }),
      });
      mutateGoals();
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  // Empty state
  if (bankTotal <= 0 || monthlyExpenses <= 0) {
    return (
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <span className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Fundo de Emergencia</h3>
              <CardInfoTip text="A Cleo calcula automaticamente quanto voce precisa ter guardado com base nos seus gastos mensais." />
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {bankTotal <= 0
                ? 'Conecte uma conta bancaria para acompanhar sua reserva.'
                : 'Registre transacoes para calcular sua reserva em meses.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const monthsCovered = balance / monthlyExpenses;
  const goalAmount = monthlyExpenses * targetMonths;
  const goalReached = monthsCovered >= targetMonths;
  const remaining = Math.max(0, goalAmount - balance);
  const monthlySavings = monthlyIncome > monthlyExpenses ? monthlyIncome - monthlyExpenses : 0;
  const coveragePercent = Math.min(Math.round((balance / goalAmount) * 100), 100);

  // Savings scenarios for the recommendation
  const scenarios = [
    { percent: 10, label: '10% da renda' },
    { percent: 15, label: '15% da renda' },
    { percent: 20, label: '20% da renda' },
  ].map(s => {
    const monthlyAmount = Math.round(monthlyIncome * s.percent / 100);
    const monthsNeeded = monthlyAmount > 0 ? Math.ceil(remaining / monthlyAmount) : 0;
    return { ...s, monthlyAmount, monthsNeeded };
  }).filter(s => s.monthlyAmount > 0 && s.monthsNeeded > 0);

  // Best scenario: use actual savings if positive, else suggest 10%
  const currentSavingsMonths = monthlySavings > 0 && remaining > 0 ? Math.ceil(remaining / monthlySavings) : 0;

  let status: 'good' | 'warning' | 'bad';
  let Icon = Shield;

  if (goalReached) {
    status = 'good';
    Icon = ShieldCheck;
  } else if (monthsCovered >= targetMonths * 0.5) {
    status = 'warning';
    Icon = Shield;
  } else {
    status = 'bad';
    Icon = ShieldAlert;
  }

  const colors = {
    good: {
      icon: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      filled: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
    },
    warning: {
      icon: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      filled: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
    },
    bad: {
      icon: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-500/10',
      filled: 'bg-red-500',
      text: 'text-red-500 dark:text-red-400',
    },
  };

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', colors[status].bg, goalReached && 'animate-pulse')}>
            <Icon className={cn('h-5 w-5', colors[status].icon)} />
          </div>
          <div>
            <span className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Fundo de Emergencia</h3>
              <CardInfoTip text="A Cleo calcula automaticamente o valor ideal da sua reserva de emergencia com base na media dos seus gastos mensais. Voce so precisa escolher quantos meses quer cobrir." />
            </span>
            <p className={cn('text-lg font-bold tabular-nums', colors[status].text)}>
              {formatMonthsCovered(monthsCovered, hideValues)}
            </p>
          </div>
        </div>

        {/* Target selector */}
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Meta: {targetMonths}m
            <ChevronDown className={cn('h-3 w-3 transition-transform', showSelector && 'rotate-180')} />
          </button>
          {showSelector && (
            <div className="absolute right-0 top-8 z-20 rounded-lg border bg-popover p-1 shadow-lg">
              {TARGET_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleTargetChange(m)}
                  className={cn(
                    'block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted',
                    m === targetMonths && 'bg-primary/10 font-medium text-primary',
                  )}
                >
                  {m} meses
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goal reached celebration */}
      {goalReached && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-xs font-medium text-green-700 dark:text-green-300">
            Meta atingida! Sua reserva cobre {Math.floor(monthsCovered)} meses de despesas.
          </p>
        </div>
      )}

      {/* Segmented progress bar */}
      <div className="mt-4">
        <div className="flex gap-1">
          {Array.from({ length: targetMonths }, (_, i) => {
            const segmentFill = Math.min(Math.max((monthsCovered - i) * 100, 0), 100);
            return (
              <div key={i} className="relative h-3 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-sm transition-all duration-500',
                    colors[status].filled,
                  )}
                  style={{ width: `${segmentFill}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>0</span>
          {targetMonths >= 6 && <span>{Math.ceil(targetMonths / 2)}m</span>}
          <span>{targetMonths}m</span>
        </div>
      </div>

      {/* Cleo's calculation — the core value proposition */}
      <div className="mt-4 rounded-md border bg-muted/30 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Calculo da Cleo</p>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Custo mensal medio
              {monthsUsed > 1 && <span className="ml-1 text-[10px]">({monthsUsed} meses)</span>}
            </span>
            <span className="font-semibold tabular-nums">{fmt(monthlyExpenses)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Reserva ideal ({targetMonths} meses)</span>
            <span className="font-bold tabular-nums text-foreground">{fmt(goalAmount)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Voce tem hoje
              {hasCustomBalance && <span className="ml-1 text-[10px] text-primary">(manual)</span>}
            </span>
            {editing ? (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">R$</span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveBalance();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  className="w-24 rounded border bg-background px-1.5 py-0.5 text-right text-xs font-semibold tabular-nums outline-none focus:border-primary"
                  disabled={saving}
                />
                <button
                  onClick={saveBalance}
                  disabled={saving}
                  className="rounded p-0.5 text-green-600 hover:bg-green-500/10 dark:text-green-400"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="group flex items-center gap-1 font-semibold tabular-nums transition-colors hover:text-primary"
                title="Clique para informar o valor da sua reserva de emergencia"
              >
                {fmt(balance)}
                <Pencil className="h-3 w-3 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
          {hasCustomBalance && !editing && (
            <button
              onClick={resetToAutomatic}
              className="text-[10px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Usar saldo bancario automaticamente ({fmt(bankTotal)})
            </button>
          )}
          {!goalReached && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Faltam</span>
              <span className={cn('font-bold tabular-nums', colors[status].text)}>{fmt(remaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendation — how to get there */}
      {!goalReached && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Como chegar la</p>

          {/* Current pace (if saving) */}
          {monthlySavings > 0 && currentSavingsMonths > 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span>No seu ritmo atual </span>
                <span className="font-semibold text-foreground">({fmt(monthlySavings)}/mes)</span>
                <span>, voce atinge a meta em </span>
                <span className="font-semibold text-foreground">{formatTimeToGoal(currentSavingsMonths)}</span>.
              </p>
            </div>
          )}

          {/* Savings scenarios table */}
          {scenarios.length > 0 && (
            <div className="mt-2 rounded-md border">
              <div className="grid grid-cols-3 border-b px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Guardar/mes</span>
                <span className="text-center">% da renda</span>
                <span className="text-right">Tempo</span>
              </div>
              {scenarios.map((s) => (
                <div
                  key={s.percent}
                  className={cn(
                    'grid grid-cols-3 items-center px-3 py-2 text-xs transition-colors',
                    s.percent === 15 && 'bg-primary/5',
                  )}
                >
                  <span className="font-semibold tabular-nums">{fmt(s.monthlyAmount)}</span>
                  <span className="text-center text-muted-foreground">{s.label}</span>
                  <span className="text-right font-medium tabular-nums">{formatTimeToGoal(s.monthsNeeded)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick tip */}
          {monthlySavings <= 0 && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-muted-foreground">
                Seus gastos estao iguais ou acima da renda. Tente reduzir despesas para comecar a montar sua reserva.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress summary footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {coveragePercent}% da meta
        </span>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-medium',
          goalReached
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : coveragePercent >= 50
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-red-500/10 text-red-500 dark:text-red-400',
        )}>
          {goalReached ? 'Meta atingida' : coveragePercent >= 50 ? 'Caminho certo' : 'Construindo'}
        </span>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldAlert, TrendingUp, Sparkles, ChevronDown, Target, Pencil, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import { CardInfoTip } from './card-info-tip';

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

function getNextMilestone(current: number, target: number): number | null {
  const milestones = [1, 3, 6, 9, 12];
  for (const m of milestones) {
    if (m > current && m <= target) return m;
  }
  return null;
}

function parseCurrencyInput(value: string): number {
  // Remove R$, spaces, dots (thousands), replace comma with dot
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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

  const bankTotal = accounts?.bankTotal || 0;
  const userDefinedBalance = goalsData?.goals?.emergency_fund_balance;
  const balance = userDefinedBalance != null ? userDefinedBalance : bankTotal;
  const hasCustomBalance = userDefinedBalance != null;
  const monthlyExpenses = summary?.expenses || 0;
  const monthlyIncome = summary?.income || 0;

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
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <span className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Fundo de Emergência</h3>
              <CardInfoTip text="Quanto tempo sua reserva cobre suas despesas mensais. O ideal é ter de 3 a 6 meses de gastos guardados." />
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {bankTotal <= 0
                ? 'Conecte uma conta bancária para acompanhar sua reserva.'
                : 'Registre transações para calcular sua reserva em meses.'}
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
  const monthsToGoal = monthlySavings > 0 && !goalReached ? Math.ceil(remaining / monthlySavings) : 0;
  const coveragePercent = Math.round((balance / goalAmount) * 100);

  const nextMilestone = getNextMilestone(monthsCovered, targetMonths);
  const nextMilestoneAmount = nextMilestone ? monthlyExpenses * nextMilestone : 0;
  const remainingToMilestone = nextMilestone ? Math.max(0, nextMilestoneAmount - balance) : 0;

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

  const idealMonthlySaving = monthlySavings > 0
    ? Math.min(monthlySavings, monthlyIncome * 0.2)
    : monthlyIncome * 0.1;
  const monthsToGoalRealistic = idealMonthlySaving > 0 ? Math.ceil(remaining / idealMonthlySaving) : 0;

  return (
    <div className="rounded-lg border bg-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', colors[status].bg, goalReached && 'animate-pulse')}>
            <Icon className={cn('h-5 w-5', colors[status].icon)} />
          </div>
          <div>
            <span className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">Fundo de Emergência</h3>
              <CardInfoTip text="Quanto tempo sua reserva cobre suas despesas mensais. O ideal é ter de 3 a 6 meses de gastos guardados." />
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
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>0</span>
          <span>{Math.ceil(targetMonths / 2)}m</span>
          <span>{targetMonths}m</span>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1.5">
        {/* Reserve balance — editable */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Reserva disponível
            {hasCustomBalance && (
              <span className="ml-1 text-[10px] text-primary">(manual)</span>
            )}
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
              className="group flex items-center gap-1 font-semibold transition-colors hover:text-primary"
            >
              {fmt(balance)}
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Reset to automatic */}
        {hasCustomBalance && !editing && (
          <button
            onClick={resetToAutomatic}
            className="text-[10px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Usar saldo bancário automaticamente ({fmt(bankTotal)})
          </button>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Despesas mensais</span>
          <span className="font-semibold">{fmt(monthlyExpenses)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Meta ({targetMonths} meses)</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{hideValues ? '' : `${coveragePercent}%`}</span>
            <span className="font-semibold">{fmt(goalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Tip: realistic actionable advice */}
      {!goalReached && (
        <div className="mt-3 space-y-2">
          {nextMilestone && nextMilestone < targetMonths && (
            <div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span>Próxima meta: <strong className="text-foreground">{nextMilestone} {nextMilestone === 1 ? 'mês' : 'meses'}</strong>. </span>
                <span>Faltam <strong className="text-foreground">{fmt(remainingToMilestone)}</strong>.</span>
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {monthlySavings > 0 && monthlySavings <= monthlyIncome * 0.5 ? (
                <>
                  <span>No seu ritmo atual ({fmt(monthlySavings)}/mês), </span>
                  <span>você atinge a meta em <strong className="text-foreground">{monthsToGoal} {monthsToGoal === 1 ? 'mês' : 'meses'}</strong>.</span>
                </>
              ) : (
                <>
                  <span>Guardando <strong className="text-foreground">{fmt(idealMonthlySaving)}/mês</strong> </span>
                  <span>(~{Math.round((idealMonthlySaving / monthlyIncome) * 100)}% da renda), </span>
                  <span>você atinge em <strong className="text-foreground">
                    {monthsToGoalRealistic > 12
                      ? `${Math.round(monthsToGoalRealistic / 12)} ${Math.round(monthsToGoalRealistic / 12) === 1 ? 'ano' : 'anos'}`
                      : `${monthsToGoalRealistic} ${monthsToGoalRealistic === 1 ? 'mês' : 'meses'}`
                    }
                  </strong>.</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

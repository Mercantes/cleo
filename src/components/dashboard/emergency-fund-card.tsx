'use client';

import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, TrendingUp, Sparkles, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface AccountsData {
  totalBalance: number;
  bankTotal: number;
}

interface SummaryData {
  expenses: number;
  income: number;
  savingsRate: number;
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

export function EmergencyFundCard() {
  const [hideValues] = useHideValues();
  const [targetMonths, setTargetMonths] = useState(getStoredTarget);
  const [showSelector, setShowSelector] = useState(false);
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const { data: accounts } = useApi<AccountsData>('/api/dashboard/accounts');
  const { data: summary } = useApi<SummaryData>('/api/dashboard/summary');

  const balance = accounts?.bankTotal || 0;
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

  // Empty state
  if (balance <= 0 || monthlyExpenses <= 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Fundo de Emergência</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {balance <= 0
                ? 'Conecte uma conta bancária para acompanhar sua reserva.'
                : 'Registre transações para calcular sua reserva em meses.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const monthsCovered = balance / monthlyExpenses;
  const monthsCoveredFloor = Math.floor(monthsCovered);
  const progress = Math.min((monthsCovered / targetMonths) * 100, 100);
  const goalReached = monthsCovered >= targetMonths;
  const remaining = Math.max(0, (monthlyExpenses * targetMonths) - balance);
  const monthlySavings = monthlyIncome > monthlyExpenses ? monthlyIncome - monthlyExpenses : 0;
  const monthsToGoal = monthlySavings > 0 && !goalReached ? Math.ceil(remaining / monthlySavings) : 0;

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
    <div className="rounded-lg border bg-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', colors[status].bg, goalReached && 'animate-pulse')}>
            <Icon className={cn('h-5 w-5', colors[status].icon)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Fundo de Emergência</h3>
            <p className={cn('text-lg font-bold tabular-nums', colors[status].text)}>
              {hideValues ? HIDDEN_VALUE : `${monthsCoveredFloor} ${monthsCoveredFloor === 1 ? 'mês' : 'meses'}`}
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
            Meta atingida! Sua reserva cobre {monthsCoveredFloor} meses de despesas.
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
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Reserva disponível</span>
          <span className="font-semibold">{fmt(balance)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Despesas mensais</span>
          <span className="font-semibold">{fmt(monthlyExpenses)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Meta ({targetMonths} meses)</span>
          <span className="font-semibold">{fmt(monthlyExpenses * targetMonths)}</span>
        </div>
      </div>

      {/* Tip: how to reach goal */}
      {!goalReached && (
        <div className="mt-3 rounded-md bg-muted/50 px-3 py-2">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              {monthlySavings > 0 ? (
                <>
                  <span>Faltam <strong className="text-foreground">{fmt(remaining)}</strong>. </span>
                  <span>No seu ritmo de economia ({fmt(monthlySavings)}/mês), você atinge em </span>
                  <strong className="text-foreground">{monthsToGoal} {monthsToGoal === 1 ? 'mês' : 'meses'}</strong>.
                </>
              ) : (
                <>
                  <span>Faltam <strong className="text-foreground">{fmt(remaining)}</strong>. </span>
                  <span>Tente guardar <strong className="text-foreground">{fmt(remaining / 6)}/mês</strong> para atingir em 6 meses.</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

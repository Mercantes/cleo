'use client';

import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface AccountsData {
  totalBalance: number;
}

interface SummaryData {
  expenses: number;
  savingsRate: number;
}

export function EmergencyFundCard() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const { data: accounts } = useApi<AccountsData>('/api/dashboard/accounts');
  const { data: summary } = useApi<SummaryData>('/api/dashboard/summary');

  const balance = accounts?.totalBalance || 0;
  const monthlyExpenses = summary?.expenses || 0;

  if (balance <= 0 || monthlyExpenses <= 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Fundo de Emergência</h3>
            <p className="text-xs text-muted-foreground">
              {balance <= 0
                ? 'Conecte uma conta bancária para acompanhar sua reserva de emergência.'
                : 'Registre transações para calcular sua reserva em meses de despesas.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const monthsCovered = Math.floor(balance / monthlyExpenses);
  const TARGET_MONTHS = 6;
  const progress = Math.min((monthsCovered / TARGET_MONTHS) * 100, 100);

  let status: 'good' | 'warning' | 'bad';
  let message: string;
  let Icon = Shield;

  if (monthsCovered >= TARGET_MONTHS) {
    status = 'good';
    message = `Parabéns! Sua reserva cobre ${monthsCovered} meses de despesas.`;
    Icon = ShieldCheck;
  } else if (monthsCovered >= 3) {
    status = 'warning';
    message = `Sua reserva cobre ${monthsCovered} meses. Meta: ${TARGET_MONTHS} meses.`;
    Icon = Shield;
  } else {
    status = 'bad';
    message = monthsCovered === 0
      ? 'Sua reserva não cobre 1 mês de despesas.'
      : `Sua reserva cobre apenas ${monthsCovered} ${monthsCovered === 1 ? 'mês' : 'meses'}.`;
    Icon = ShieldAlert;
  }

  const colors = {
    good: { icon: 'text-green-600 dark:text-green-400', bar: 'bg-green-500', bg: 'bg-green-500/10' },
    warning: { icon: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', bg: 'bg-amber-500/10' },
    bad: { icon: 'text-red-500 dark:text-red-400', bar: 'bg-red-500', bg: 'bg-red-500/10' },
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', colors[status].bg)}>
          <Icon className={cn('h-4 w-4', colors[status].icon)} />
        </div>
        <div>
          <h3 className="text-sm font-medium">Fundo de Emergência</h3>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fmt(balance)} disponível</span>
          <span>{monthsCovered}/{TARGET_MONTHS} meses</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', colors[status].bar)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0</span>
          <span>3 meses</span>
          <span>6 meses</span>
        </div>
        {monthsCovered < TARGET_MONTHS && (
          <p className="mt-2 text-xs text-muted-foreground">
            Faltam {fmt(monthlyExpenses * TARGET_MONTHS - balance)} para {TARGET_MONTHS} meses de reserva
          </p>
        )}
        {monthsCovered < TARGET_MONTHS && monthlyExpenses > 0 && (() => {
          const remaining = (monthlyExpenses * TARGET_MONTHS) - balance;
          const actualSavingsRate = summary?.savingsRate || 0;
          const monthlySavings = actualSavingsRate > 0 ? (monthlyExpenses * actualSavingsRate / 100) : 0;
          if (monthlySavings <= 0) return null;
          const monthsToGoal = Math.ceil(remaining / monthlySavings);
          return (
            <p className="mt-1 text-[10px] text-muted-foreground">
              No seu ritmo atual de economia ({Math.round(actualSavingsRate)}%), levaria ~{monthsToGoal} {monthsToGoal === 1 ? 'mês' : 'meses'}
            </p>
          );
        })()}
      </div>
    </div>
  );
}

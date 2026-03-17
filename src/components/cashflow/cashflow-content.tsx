'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

const AreaChart = dynamic(() => import('recharts').then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ReferenceLine = dynamic(() => import('recharts').then((m) => m.ReferenceLine), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });

interface DayData {
  date: string;
  day: number;
  income: number;
  expenses: number;
  net: number;
  balance: number;
}

interface CategoryBreakdown {
  name: string;
  icon: string;
  total: number;
}

interface TopExpense {
  description: string;
  amount: number;
  date: string;
  category: { name: string; icon: string } | null;
}

interface CashFlowData {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  totalNet: number;
  bestDay: DayData | null;
  worstDay: DayData | null;
  days: DayData[];
  categoryBreakdown: CategoryBreakdown[];
  topExpenses: TopExpense[];
}

type ChartView = 'balance' | 'daily';

function getMonthOptions() {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
  }
  return options;
}

function formatDay(date: string) {
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatWeekday(date: string) {
  const d = new Date(date + 'T12:00:00');
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'short' });
  return wd.charAt(0).toUpperCase() + wd.slice(1).replace('.', '');
}

export function CashFlowContent() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [month, setMonth] = useState(currentMonth);
  const [chartView, setChartView] = useState<ChartView>('balance');
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const currentIdx = monthOptions.findIndex((o) => o.value === month);
  const canPrev = currentIdx < monthOptions.length - 1;
  const canNext = currentIdx > 0;

  const { data, isLoading } = useApi<CashFlowData>(`/api/cashflow?month=${month}`);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-[350px] animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  const hasData = data && data.days.some((d) => d.income > 0 || d.expenses > 0);

  if (!hasData) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Sem movimentações neste mês"
        description="Conecte seu banco ou importe transações para visualizar o fluxo de caixa."
      />
    );
  }

  const { totalIncome, totalExpenses, totalNet, bestDay, worstDay, days, categoryBreakdown, topExpenses } = data!;

  // Filter days with activity for the table
  const activeDays = days.filter((d) => d.income > 0 || d.expenses > 0);

  // Max category total for percentage bar
  const maxCategoryTotal = categoryBreakdown.length > 0 ? categoryBreakdown[0].total : 1;

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => canPrev && setMonth(monthOptions[currentIdx + 1].value)}
            disabled={!canPrev}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => canNext && setMonth(monthOptions[currentIdx - 1].value)}
            disabled={!canNext}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
            Entradas
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
            {fmt(totalIncome)}
          </p>
          {totalIncome > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Média diária: {fmt(totalIncome / activeDays.length || 1)}
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            Saídas
          </div>
          <p className="mt-1 text-2xl font-bold text-red-500 dark:text-red-400">
            {fmt(totalExpenses)}
          </p>
          {totalExpenses > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Média diária: {fmt(totalExpenses / activeDays.length || 1)}
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {totalNet >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            Saldo do Mês
          </div>
          <p className={cn(
            'mt-1 text-2xl font-bold',
            totalNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
          )}>
            {fmt(totalNet)}
          </p>
          {totalIncome > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Taxa de economia: {Math.round((totalNet / totalIncome) * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* Highlights */}
      {(bestDay || worstDay) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {bestDay && bestDay.net > 0 && (
            <div className="flex items-center gap-3 rounded-lg border bg-green-50 p-3 dark:bg-green-950/20">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/40">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Melhor dia</p>
                <p className="text-sm font-medium">
                  {formatDay(bestDay.date)} — <span className="text-green-600 dark:text-green-400">{fmt(bestDay.net)}</span>
                </p>
              </div>
            </div>
          )}
          {worstDay && worstDay.net < 0 && (
            <div className="flex items-center gap-3 rounded-lg border bg-red-50 p-3 dark:bg-red-950/20">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/40">
                <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pior dia</p>
                <p className="text-sm font-medium">
                  {formatDay(worstDay.date)} — <span className="text-red-500 dark:text-red-400">{fmt(worstDay.net)}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {chartView === 'balance' ? 'Saldo Acumulado' : 'Entradas vs Saídas'}
          </h2>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setChartView('balance')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                chartView === 'balance' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Acumulado
            </button>
            <button
              onClick={() => setChartView('daily')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                chartView === 'daily' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Diário
            </button>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'balance' ? (
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  className="fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  className="fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [hideValues ? HIDDEN_VALUE : formatCurrency(Number(v)), 'Saldo']}
                  labelFormatter={(day) => `Dia ${day}`}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#balanceGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  className="fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  className="fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v, name) => [
                    hideValues ? HIDDEN_VALUE : formatCurrency(Number(v)),
                    name === 'income' ? 'Entradas' : 'Saídas',
                  ]}
                  labelFormatter={(day) => `Dia ${day}`}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="income" fill="#22C55E" radius={[3, 3, 0, 0]} name="income" />
                <Bar dataKey="expenses" fill="#EF4444" radius={[3, 3, 0, 0]} name="expenses" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown + Top expenses */}
      {(categoryBreakdown.length > 0 || topExpenses.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Category breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Gastos por Categoria</h2>
              </div>
              <div className="divide-y">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base">{cat.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{cat.name}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-red-500 dark:text-red-400">
                          {fmt(cat.total)}
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {totalExpenses > 0 ? `${Math.round((cat.total / totalExpenses) * 100)}%` : ''}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-red-500/70 transition-all dark:bg-red-400/70"
                          style={{ width: `${(cat.total / maxCategoryTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top expenses */}
          {topExpenses.length > 0 && (
            <div className="rounded-xl border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Maiores Gastos</h2>
              </div>
              <div className="divide-y">
                {topExpenses.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDay(tx.date)}
                        {tx.category && ` · ${tx.category.icon} ${tx.category.name}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-red-500 dark:text-red-400">
                      {fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily breakdown table */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Movimentação Diária</h2>
            <span className="text-[10px] text-muted-foreground">{activeDays.length} dia{activeDays.length !== 1 ? 's' : ''} com movimentação</span>
          </div>
        </div>
        {/* Table header */}
        <div className="hidden items-center gap-2 border-b px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
          <span className="w-24">Data</span>
          <span className="w-16 text-center">Dia</span>
          <span className="flex-1 text-right">Entradas</span>
          <span className="flex-1 text-right">Saídas</span>
          <span className="flex-1 text-right">Líquido</span>
          <span className="flex-1 text-right">Acumulado</span>
        </div>
        <div className="divide-y">
          {activeDays.map((day) => {
            const dayDate = new Date(day.date + 'T12:00:00');
            const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
            const todayStr = new Date().toISOString().slice(0, 10);
            const isToday = day.date === todayStr;
            return (
            <div key={day.date} className={cn('flex items-center gap-2 px-4 py-2.5 text-sm', isWeekend && 'bg-muted/30', isToday && 'ring-1 ring-primary/30 bg-primary/5')}>
              <span className="w-24 text-muted-foreground">{formatDay(day.date)}</span>
              <span className={cn('w-16 text-center text-xs', isWeekend ? 'font-medium text-primary' : 'text-muted-foreground')}>{formatWeekday(day.date)}</span>
              <span className="flex-1 text-right text-green-600 dark:text-green-400">
                {day.income > 0 ? fmt(day.income) : '—'}
              </span>
              <span className="flex-1 text-right text-red-500 dark:text-red-400">
                {day.expenses > 0 ? fmt(day.expenses) : '—'}
              </span>
              <span className={cn(
                'flex-1 text-right font-medium',
                day.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
              )}>
                {fmt(day.net)}
              </span>
              <span className={cn(
                'flex-1 text-right font-medium',
                day.balance >= 0 ? 'text-foreground' : 'text-red-500 dark:text-red-400',
              )}>
                {fmt(day.balance)}
              </span>
            </div>
            );
          })}
        </div>
        {activeDays.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma movimentação neste mês.
          </div>
        )}
      </div>
    </div>
  );
}

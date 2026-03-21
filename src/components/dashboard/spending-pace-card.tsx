'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { SummaryData } from '@/types/dashboard';

interface SpendingPaceCardProps {
  data: SummaryData;
}

function buildDailyData(expenses: number, prevExpenses: number) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lastMonthTotal = prevExpenses > 0 ? prevExpenses : expenses;

  const points = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const progress = d / daysInMonth;
    // Current month: cumulative up to today, projected after
    const currentValue = d <= dayOfMonth ? Math.round(expenses * (d / dayOfMonth)) : undefined;
    // Last month: linear approximation
    const lastValue = Math.round(lastMonthTotal * progress);
    points.push({
      day: d,
      current: currentValue,
      last: lastValue,
    });
  }
  return points;
}

function PaceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: number }) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  if (!active || !payload?.length) return null;
  const current = payload.find((p) => p.dataKey === 'current');
  const last = payload.find((p) => p.dataKey === 'last');

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-foreground">Dia {label}</p>
      <div className="space-y-1">
        {current?.value != null && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Este mês</span>
            </div>
            <span className="text-xs font-medium">{fmt(current.value)}</span>
          </div>
        )}
        {last?.value != null && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="text-xs text-muted-foreground">Mês passado</span>
            </div>
            <span className="text-xs font-medium">{fmt(last.value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function subscribeToDarkMode(callback: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.classList.contains('dark');
}

function getIsDarkServer() {
  return false;
}

function useIsDark() {
  return useSyncExternalStore(subscribeToDarkMode, getIsDark, getIsDarkServer);
}

export function SpendingPaceCard({ data }: SpendingPaceCardProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const dailyData = useMemo(() => buildDailyData(data.expenses, data.prevExpenses), [data.expenses, data.prevExpenses]);
  const isDark = useIsDark();
  const greenColor = isDark ? 'rgb(74,222,128)' : 'rgb(34,197,94)';
  const slateColor = isDark ? 'rgb(148,163,184)' : 'rgb(100,116,139)';

  const isOver = data.percentChange > 0;
  const now = new Date();
  const dayOfMonth = now.getDate();
  const lastMonthTotal = data.prevExpenses > 0 ? data.prevExpenses : data.expenses;

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ritmo de Gastos</p>
        <Link href={`/transactions?type=debit&from=${monthStart}&to=${monthEnd}`} className="text-xs font-medium text-primary hover:underline">
          Ver todas ↗
        </Link>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{fmt(data.expenses)}</span>
        <span className={`text-sm font-medium ${isOver ? 'text-red-500' : 'text-green-500'}`}>
          {isOver ? 'acima' : 'abaixo'}
        </span>
      </div>
      {(() => {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysLeft = daysInMonth - dayOfMonth;
        const dailyAvg = dayOfMonth > 0 ? data.expenses / dayOfMonth : 0;
        return daysLeft > 0 && dailyAvg > 0 ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {fmt(dailyAvg)}/dia · {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
          </p>
        ) : null;
      })()}
      {dayOfMonth >= 3 && (() => {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const projected = Math.round(data.expenses / dayOfMonth * daysInMonth);
        return (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Projeção: {fmt(projected)} até o fim do mês
          </p>
        );
      })()}

      <div className="mt-1 flex items-center gap-2">
        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
          isOver ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
        }`}>
          {isOver ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isOver ? '+' : ''}{data.percentChange}%
        </span>
        <span className="text-xs text-muted-foreground">
          vs {fmt(lastMonthTotal)} mês anterior
        </span>
      </div>

      <div className="mt-4 min-h-[160px] w-full flex-1" role="img" aria-label="Gráfico de ritmo de gastos comparando mês atual com anterior">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={greenColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={greenColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="day"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
              tickFormatter={(v: number) => (v === 1 || v % 5 === 0 ? String(v) : '')}
            />
            <YAxis
              fontSize={11}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              tickFormatter={(v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`}
              width={60}
            />
            <Tooltip content={<PaceTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
            {/* Last month - dashed gray */}
            <Area
              type="monotone"
              dataKey="last"
              stroke={slateColor}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
              connectNulls={false}
            />
            {/* Current month - solid green */}
            <Area
              type="monotone"
              dataKey="current"
              stroke={greenColor}
              strokeWidth={2}
              fill="url(#spendingGrad)"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded bg-green-500" /> Este mês
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded bg-slate-400" style={{ borderTop: '1.5px dashed' }} /> Mês passado
          </span>
        </div>
        {lastMonthTotal > 0 && (() => {
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const expectedPace = (dayOfMonth / daysInMonth) * lastMonthTotal;
          const diff = ((data.expenses - expectedPace) / expectedPace) * 100;
          const label = Math.abs(diff) < 5 ? 'No ritmo' : diff > 0 ? 'Acima do ritmo' : 'Abaixo do ritmo';
          const color = Math.abs(diff) < 5 ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' : diff > 0 ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950' : 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
          return (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>
              {label}
            </span>
          );
        })()}
      </div>
    </div>
  );
}

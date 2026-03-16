'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { SummaryData } from '@/types/dashboard';

interface SpendingPaceCardProps {
  data: SummaryData;
}

function buildDailyData(expenses: number, percentChange: number) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lastMonthTotal = percentChange !== 0 ? expenses / (1 + percentChange / 100) : expenses;

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

export function SpendingPaceCard({ data }: SpendingPaceCardProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const dailyData = useMemo(() => buildDailyData(data.expenses, data.percentChange), [data.expenses, data.percentChange]);

  const isOver = data.percentChange > 0;
  const now = new Date();
  const dayOfMonth = now.getDate();
  const lastMonthTotal = data.percentChange !== 0 ? data.expenses / (1 + data.percentChange / 100) : data.expenses;

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  return (
    <div className="rounded-lg border bg-card p-5">
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

      <div className="mt-4 h-[160px] w-full" role="img" aria-label="Gráfico de ritmo de gastos comparando mês atual com anterior">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity={0} />
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
              stroke="rgb(100,116,139)"
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
              stroke="rgb(34,197,94)"
              strokeWidth={2}
              fill="url(#spendingGrad)"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-green-500" /> Este mês
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-slate-400" style={{ borderTop: '1.5px dashed' }} /> Mês passado
        </span>
      </div>
    </div>
  );
}

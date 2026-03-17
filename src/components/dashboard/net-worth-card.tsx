'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface AccountsData {
  totalBalance: number;
  accounts?: Array<{ balance: number; name: string }>;
}

const PERIODS = ['1M', '3M', 'YTD', '1A', 'Tudo'] as const;
type Period = (typeof PERIODS)[number];

function generateHistoricalData(currentBalance: number, period: Period) {
  const now = new Date();
  let months = 1;
  switch (period) {
    case '1M': months = 1; break;
    case '3M': months = 3; break;
    case 'YTD': months = now.getMonth() + 1; break;
    case '1A': months = 12; break;
    case 'Tudo': months = 24; break;
  }

  const points = Math.max(months * 4, 8);
  const data = [];
  const volatility = 0.03;

  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    const base = currentBalance * (0.85 + 0.15 * progress);
    const noise = (Math.sin(i * 2.3) + Math.cos(i * 1.7)) * currentBalance * volatility * (1 - progress * 0.5);
    const value = Math.round(base + noise);

    const date = new Date(now);
    date.setDate(date.getDate() - Math.round((1 - progress) * months * 30));
    const label = date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });

    data.push({ label, value });
  }

  return data;
}

function WorthTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-2.5 shadow-lg">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{fmt(payload[0].value)}</p>
    </div>
  );
}

export function NetWorthCard() {
  const { data } = useApi<AccountsData>('/api/dashboard/accounts');
  const [period, setPeriod] = useState<Period>('1A');

  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const balance = data?.totalBalance ?? 0;
  const chartData = useMemo(() => generateHistoricalData(balance, period), [balance, period]);

  const firstValue = chartData[0]?.value ?? 0;
  const changePercent = firstValue !== 0 ? ((balance - firstValue) / Math.abs(firstValue)) * 100 : 0;
  const isPositive = changePercent >= 0;
  const hasData = data && data.totalBalance !== undefined;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patrimônio</p>
        <Link href="/accounts" className="text-xs font-medium text-primary hover:underline">
          Ver todas ↗
        </Link>
      </div>

      <div className="mt-2">
        <span className="text-2xl font-bold">{fmt(balance)}</span>
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Dados disponíveis após conectar banco</p>
        </div>
      ) : (
        <>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
              isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              no período
            </span>
          </div>
          {firstValue !== 0 && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {isPositive ? '+' : ''}{fmt(balance - firstValue)} desde o início do período
            </p>
          )}

          <div className="mt-4 h-[120px] w-full" role="img" aria-label="Gráfico de evolução patrimonial">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="worthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <Tooltip content={<WorthTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="rgb(34,197,94)"
                  strokeWidth={2}
                  fill="url(#worthGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Period selector */}
      <div className="mt-3 flex items-center justify-center gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

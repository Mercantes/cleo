'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface CategoryData {
  name: string;
  amount: number;
  categoryId: string | null;
  percentage: number;
  color: string;
  change?: number | null;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: CategoryData }> }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-popover p-2.5 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        <span className="text-xs font-semibold text-foreground">{entry.name}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-sm font-bold text-foreground">{formatCurrency(entry.value)}</span>
        <span className="text-xs text-muted-foreground">{entry.payload.percentage}%</span>
      </div>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.amount, 0), [data]);

  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">Despesas por Categoria</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-[200px] w-[200px]" role="img" aria-label="Gráfico de pizza mostrando distribuição de despesas por categoria">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {data.map((cat) => {
            const href = cat.categoryId === null
              ? '/transactions?category=uncategorized'
              : cat.categoryId === '_others'
                ? '/transactions'
                : `/transactions?category=${encodeURIComponent(cat.categoryId)}`;
            return (
            <Link
              key={cat.name}
              href={href}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="font-medium">{formatCurrency(cat.amount)}</span>
                  <span className="ml-1 text-muted-foreground">{cat.percentage}%</span>
                </div>
                {cat.change != null && cat.change !== 0 && (
                  <span className={`text-[10px] font-semibold ${cat.change > 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {cat.change > 0 ? '+' : ''}{cat.change}%
                  </span>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

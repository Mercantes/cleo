'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface MonthData {
  label: string;
  income: number;
  expenses: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
  const expenses = payload.find((p) => p.dataKey === 'expenses')?.value || 0;
  const balance = income - expenses;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <span className="text-xs font-medium text-foreground">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Despesas</span>
          </div>
          <span className="text-xs font-medium text-foreground">{formatCurrency(expenses)}</span>
        </div>
        <div className="border-t pt-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Saldo</span>
            <span className={`text-xs font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpenseChart({ data }: { data: MonthData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">Receita vs Despesas</h3>
      <div className="h-[250px] w-full" role="img" aria-label="Gráfico de barras comparando receita e despesas mensais">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }} />
            <Legend formatter={(value: string) => (value === 'income' ? 'Receita' : 'Despesas')} />
            <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface MonthData {
  label: string;
  income: number;
  expenses: number;
}

export function ExpenseChart({ data }: { data: MonthData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">Receita vs Despesas</h3>
      <div className="h-[250px] w-full" role="img" aria-label="Gráfico de barras comparando receita e despesas mensais">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === 'income' ? 'Receita' : 'Despesas',
              ]}
            />
            <Legend formatter={(value: string) => (value === 'income' ? 'Receita' : 'Despesas')} />
            <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

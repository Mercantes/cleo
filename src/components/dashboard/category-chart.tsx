'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">Despesas por Categoria</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-[200px] w-[200px]">
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
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(cat.amount)}</span>
                <span className="ml-2 text-muted-foreground">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

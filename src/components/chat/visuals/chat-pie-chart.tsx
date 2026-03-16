'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { PieChartData } from '@/lib/ai/visual-types';

export function ChatPieChart({ data, title }: { data: PieChartData[]; title: string }) {
  const [hideValues] = useHideValues();

  return (
    <div className="my-2 w-full max-w-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex items-center gap-3">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => hideValues ? HIDDEN_VALUE : formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { BarChartData } from '@/lib/ai/visual-types';

export function ChatBarChart({ data, title }: { data: BarChartData[]; title: string }) {
  return (
    <div className="my-2 w-full max-w-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="label" fontSize={10} />
          <YAxis fontSize={10} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

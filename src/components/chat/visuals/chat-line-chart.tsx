'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { LineChartData } from '@/lib/ai/visual-types';

export function ChatLineChart({ data, title }: { data: LineChartData[]; title: string }) {
  return (
    <div className="my-2 w-full max-w-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="label" fontSize={10} />
          <YAxis fontSize={10} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

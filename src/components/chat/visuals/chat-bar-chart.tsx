'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { BarChartData } from '@/lib/ai/visual-types';

export function ChatBarChart({ data, title }: { data: BarChartData[]; title: string }) {
  const [hideValues] = useHideValues();

  return (
    <div className="my-2 w-full max-w-sm sm:max-w-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="label" fontSize={10} />
          <YAxis fontSize={10} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => hideValues ? HIDDEN_VALUE : formatCurrency(Number(value))} />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

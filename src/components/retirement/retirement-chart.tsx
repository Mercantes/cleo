'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface RetirementChartProps {
  timeline: { year: number; balance: number }[];
  fiNumber: number;
}

export function RetirementChart({ timeline, fiNumber }: RetirementChartProps) {
  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Crescimento do patrimônio</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={timeline}>
          <XAxis dataKey="year" fontSize={11} tickFormatter={(v) => `${v}a`} />
          <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Ano ${label}`}
          />
          <ReferenceLine
            y={fiNumber}
            stroke="#22C55E"
            strokeDasharray="5 5"
            label={{ value: 'Meta FIRE', position: 'right', fontSize: 10, fill: '#22C55E' }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3B82F6"
            fill="#3B82F620"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

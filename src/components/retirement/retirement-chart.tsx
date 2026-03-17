'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';

interface RetirementChartProps {
  timeline: { year: number; balance: number }[];
  fiNumber: number;
}

export function RetirementChart({ timeline, fiNumber }: RetirementChartProps) {
  const [hideValues] = useHideValues();

  const crossYear = timeline.find(p => p.balance >= fiNumber);
  const lastBalance = timeline.length > 0 ? timeline[timeline.length - 1].balance : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Crescimento do patrimônio</p>
        <p className="text-[10px] text-muted-foreground">
          {crossYear
            ? `Meta atingida no ano ${crossYear.year}`
            : `Projeção: ${hideValues ? HIDDEN_VALUE : formatCurrency(lastBalance)} em ${timeline.length > 0 ? timeline[timeline.length - 1].year : 0} anos`}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={timeline}>
          <XAxis dataKey="year" fontSize={11} tickFormatter={(v) => `${v}a`} />
          <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => hideValues ? HIDDEN_VALUE : formatCurrency(Number(value))}
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

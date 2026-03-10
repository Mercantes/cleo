'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import type { ProjectionScenario } from '@/lib/finance/projection-engine';

const SCENARIO_COLORS = {
  optimistic: '#22C55E',
  realistic: '#3B82F6',
  pessimistic: '#EF4444',
};

const SCENARIO_LABELS = {
  optimistic: 'Otimista',
  realistic: 'Realista',
  pessimistic: 'Pessimista',
};

interface ProjectionChartProps {
  scenarios: ProjectionScenario[];
}

export function ProjectionChart({ scenarios }: ProjectionChartProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  if (scenarios.length === 0) return null;

  // Merge scenario data into single array for Recharts
  const months = scenarios[0].monthlyData.length;
  const chartData = Array.from({ length: months }, (_, i) => {
    const point: Record<string, string | number> = { month: scenarios[0].monthlyData[i].month };
    for (const s of scenarios) {
      point[s.label] = s.monthlyData[i].balance;
    }
    return point;
  });

  return (
    <div className="w-full">
      <div className="mb-3 flex gap-2">
        {scenarios.map((s) => (
          <button
            key={s.label}
            onClick={() => setActiveScenario(activeScenario === s.label ? null : s.label)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-opacity ${
              activeScenario && activeScenario !== s.label ? 'opacity-40' : 'opacity-100'
            }`}
            style={{ backgroundColor: `${SCENARIO_COLORS[s.label]}20`, color: SCENARIO_COLORS[s.label] }}
          >
            {SCENARIO_LABELS[s.label]}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="month" fontSize={11} />
          <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend formatter={(value) => SCENARIO_LABELS[value as keyof typeof SCENARIO_LABELS] || value} />
          {scenarios.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={SCENARIO_COLORS[s.label]}
              strokeWidth={activeScenario === s.label ? 3 : activeScenario ? 1 : 2}
              strokeOpacity={activeScenario && activeScenario !== s.label ? 0.3 : 1}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

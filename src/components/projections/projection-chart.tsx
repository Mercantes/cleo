'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { ProjectionScenario } from '@/lib/finance/projection-engine';

const SCENARIO_COLORS: Record<string, string> = {
  optimistic: '#22C55E',
  realistic: '#3B82F6',
  pessimistic: '#EF4444',
};

const SCENARIO_LABELS: Record<string, string> = {
  optimistic: 'Otimista',
  realistic: 'Realista',
  pessimistic: 'Pessimista',
};

interface ProjectionChartProps {
  scenarios: ProjectionScenario[];
  activeScenario: string;
  onScenarioChange: (scenario: string) => void;
  horizon: number | null;
}

export function ProjectionChart({ scenarios, activeScenario, onScenarioChange, horizon }: ProjectionChartProps) {
  const [hideValues] = useHideValues();

  const chartData = useMemo(() => {
    if (scenarios.length === 0) return [];
    const totalMonths = scenarios[0].monthlyData.length;
    const limit = horizon ? Math.min(horizon, totalMonths) : totalMonths;
    return Array.from({ length: limit }, (_, i) => {
      const point: Record<string, string | number> = { month: scenarios[0].monthlyData[i].month };
      for (const s of scenarios) {
        point[s.label] = s.monthlyData[i].balance;
      }
      return point;
    });
  }, [scenarios, horizon]);

  if (scenarios.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-3 flex gap-2">
        {scenarios.map((s) => (
          <button
            key={s.label}
            onClick={() => onScenarioChange(s.label)}
            aria-label={`Filtrar cenário ${SCENARIO_LABELS[s.label]}`}
            aria-pressed={activeScenario === s.label}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              activeScenario !== s.label ? 'opacity-40' : 'opacity-100'
            }`}
            style={{ backgroundColor: `${SCENARIO_COLORS[s.label]}20`, color: SCENARIO_COLORS[s.label] }}
          >
            {SCENARIO_LABELS[s.label]}
          </button>
        ))}
      </div>
      <div role="img" aria-label="Gráfico de projeção financeira com cenários otimista, realista e pessimista">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="month" fontSize={11} />
          <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => hideValues ? HIDDEN_VALUE : formatCurrency(Number(value))} />
          <Legend formatter={(value) => SCENARIO_LABELS[value as keyof typeof SCENARIO_LABELS] || value} />
          {scenarios.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={SCENARIO_COLORS[s.label]}
              strokeWidth={activeScenario === s.label ? 3 : 1}
              strokeOpacity={activeScenario !== s.label ? 0.3 : 1}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectionChart } from '@/components/projections/projection-chart';
import type { ProjectionScenario } from '@/lib/finance/projection-engine';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockScenarios: ProjectionScenario[] = [
  {
    label: 'optimistic',
    monthlyData: [
      { month: 'Abr/26', balance: 12500 },
      { month: 'Mai/26', balance: 15000 },
    ],
    finalBalance: 15000,
    monthlySavings: 2500,
  },
  {
    label: 'realistic',
    monthlyData: [
      { month: 'Abr/26', balance: 12000 },
      { month: 'Mai/26', balance: 14000 },
    ],
    finalBalance: 14000,
    monthlySavings: 2000,
  },
  {
    label: 'pessimistic',
    monthlyData: [
      { month: 'Abr/26', balance: 11500 },
      { month: 'Mai/26', balance: 13000 },
    ],
    finalBalance: 13000,
    monthlySavings: 1500,
  },
];

describe('ProjectionChart', () => {
  it('renders chart with scenario buttons', () => {
    render(<ProjectionChart scenarios={mockScenarios} activeScenario="realistic" onScenarioChange={() => {}} horizon={null} />);
    expect(screen.getByText('Otimista')).toBeDefined();
    expect(screen.getByText('Realista')).toBeDefined();
    expect(screen.getByText('Pessimista')).toBeDefined();
    expect(screen.getByTestId('line-chart')).toBeDefined();
  });

  it('renders nothing when scenarios empty', () => {
    const { container } = render(<ProjectionChart scenarios={[]} activeScenario="realistic" onScenarioChange={() => {}} horizon={null} />);
    expect(container.innerHTML).toBe('');
  });
});

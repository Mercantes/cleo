import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatVisual } from '@/components/chat/chat-visual';
import type { VisualMetadata } from '@/lib/ai/visual-types';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
}));

describe('ChatVisual', () => {
  it('renders bar chart', () => {
    const visual: VisualMetadata = {
      type: 'bar',
      title: 'Gastos Mensais',
      data: [{ label: 'Jan', value: 1500 }, { label: 'Fev', value: 2000 }],
    };
    render(<ChatVisual visual={visual} />);
    expect(screen.getByText('Gastos Mensais')).toBeDefined();
    expect(screen.getByTestId('bar-chart')).toBeDefined();
  });

  it('renders pie chart', () => {
    const visual: VisualMetadata = {
      type: 'pie',
      title: 'Categorias',
      data: [{ name: 'Alimentação', value: 500, color: '#3B82F6' }],
    };
    render(<ChatVisual visual={visual} />);
    expect(screen.getByText('Categorias')).toBeDefined();
    expect(screen.getByTestId('pie-chart')).toBeDefined();
  });

  it('renders table', () => {
    const visual: VisualMetadata = {
      type: 'table',
      title: 'Resumo',
      data: { headers: ['Mês', 'Total'], rows: [['Janeiro', 1500]] },
    };
    render(<ChatVisual visual={visual} />);
    expect(screen.getByText('Resumo')).toBeDefined();
    expect(screen.getByText('Mês')).toBeDefined();
    expect(screen.getByText('Janeiro')).toBeDefined();
  });

  it('renders fallback for invalid data', () => {
    const visual: VisualMetadata = {
      type: 'bar',
      title: 'Invalid',
      data: { headers: ['A'], rows: [] } as unknown as VisualMetadata['data'],
    };
    render(<ChatVisual visual={visual} />);
    expect(screen.getByText('Invalid')).toBeDefined();
  });
});

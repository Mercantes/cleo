import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

// Mock recharts to avoid SSR issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<DashboardContent />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders summary cards with data', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            income: 5000, expenses: 3500, balance: 1500,
            savingsRate: 30, percentChange: -10, month: '2026-03',
          }),
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          json: () => Promise.resolve({ categories: [] }),
        });
      }
      if (url.includes('/trends')) {
        return Promise.resolve({
          json: () => Promise.resolve({ months: [] }),
        });
      }
      // /api/recurring
      return Promise.resolve({
        json: () => Promise.resolve({ subscriptions: [], installments: [], monthlyTotal: 0 }),
      });
    });

    render(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText('Receita')).toBeInTheDocument();
      expect(screen.getByText('Despesas')).toBeInTheDocument();
      expect(screen.getByText('Saldo')).toBeInTheDocument();
      expect(screen.getByText('Taxa de poupança')).toBeInTheDocument();
    });
  });

  it('renders variation message', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            income: 5000, expenses: 3500, balance: 1500,
            savingsRate: 30, percentChange: 15, month: '2026-03',
          }),
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({ json: () => Promise.resolve({ categories: [] }) });
      }
      if (url.includes('/trends')) {
        return Promise.resolve({ json: () => Promise.resolve({ months: [] }) });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ subscriptions: [], installments: [], monthlyTotal: 0 }),
      });
    });

    render(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText(/15% a mais/)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/dashboard',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => <a {...props}>{children}</a>,
}));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="dynamic-component" />,
}));

// Mock recharts fully
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
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
}));

// Mock sub-components that fetch their own data or have complex deps
vi.mock('@/components/dashboard/month-selector', () => ({
  MonthSelector: () => <div data-testid="month-selector" />,
}));
vi.mock('@/components/dashboard/subscriptions-card', () => ({
  SubscriptionsCard: () => <div data-testid="subscriptions-card" />,
}));
vi.mock('@/components/dashboard/goal-progress-card', () => ({
  GoalProgressCard: () => <div data-testid="goal-progress-card" />,
}));
vi.mock('@/components/dashboard/challenges-card', () => ({
  ChallengesCard: () => <div data-testid="challenges-card" />,
}));
vi.mock('@/components/dashboard/spending-forecast', () => ({
  SpendingForecast: () => <div data-testid="spending-forecast" />,
}));
vi.mock('@/components/dashboard/financial-health-card', () => ({
  FinancialHealthCard: () => <div data-testid="financial-health-card" />,
}));
vi.mock('@/components/dashboard/accounts-card', () => ({
  AccountsCard: () => <div data-testid="accounts-card" />,
}));
vi.mock('@/components/dashboard/recent-transactions-card', () => ({
  RecentTransactionsCard: () => <div data-testid="recent-transactions-card" />,
}));
vi.mock('@/components/dashboard/setup-checklist', () => ({
  SetupChecklist: () => <div data-testid="setup-checklist" />,
}));
vi.mock('@/components/dashboard/category-budgets-card', () => ({
  CategoryBudgetsCard: () => <div data-testid="category-budgets-card" />,
}));
vi.mock('@/components/dashboard/streak-card', () => ({
  StreakCard: () => <div data-testid="streak-card" />,
}));
vi.mock('@/components/dashboard/categories-table-card', () => ({
  CategoriesTableCard: () => <div data-testid="categories-table-card" />,
}));
vi.mock('@/components/dashboard/upcoming-expenses-card', () => ({
  UpcomingExpensesCard: () => <div data-testid="upcoming-expenses-card" />,
}));
vi.mock('@/components/ui/animate-in', () => ({
  AnimateIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/use-pull-to-refresh', () => ({
  usePullToRefresh: () => ({ indicatorRef: { current: null } }),
}));
vi.mock('@/hooks/use-hide-values', () => ({
  useHideValues: () => [false],
  HIDDEN_VALUE: '***',
}));

// Need to mock the partial-result-card to control what it renders
vi.mock('@/components/dashboard/partial-result-card', () => ({
  PartialResultCard: ({ data }: { data: { percentChange: number } }) => (
    <div data-testid="partial-result-card">
      {data.percentChange !== 0 && (
        <span>
          {data.percentChange > 0 ? '+' : ''}{data.percentChange}% vs mês anterior
        </span>
      )}
    </div>
  ),
}));
vi.mock('@/components/dashboard/spending-pace-card', () => ({
  SpendingPaceCard: () => <div data-testid="spending-pace-card" />,
}));
vi.mock('@/components/dashboard/net-worth-card', () => ({
  NetWorthCard: () => <div data-testid="net-worth-card" />,
}));
vi.mock('@/components/ui/toast', () => ({
  toast: vi.fn(),
}));

import { DashboardContent } from '@/components/dashboard/dashboard-content';

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

  it('renders dashboard with data', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            income: 5000, expenses: 3500, balance: 1500,
            savingsRate: 30, percentChange: -10, month: '2026-03',
          }),
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ categories: [] }),
        });
      }
      if (url.includes('/trends')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ months: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getAllByText(/Economia de 30% este mês/).length).toBeGreaterThan(0);
    });
  });

  it('renders variation info in partial result', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            income: 5000, expenses: 3500, balance: 1500,
            savingsRate: 30, percentChange: 15, month: '2026-03',
          }),
        });
      }
      if (url.includes('/categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ categories: [] }) });
      }
      if (url.includes('/trends')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ months: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<DashboardContent />);

    await waitFor(() => {
      expect(screen.getByText(/\+15% vs mês anterior/)).toBeInTheDocument();
    });
  });
});

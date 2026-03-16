import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecurringList } from '@/components/recurring/recurring-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/recurring',
}));

const mockUseApi = vi.fn();
vi.mock('@/hooks/use-api', () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('RecurringList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    mockUseApi.mockReturnValue({ data: undefined, isLoading: true, error: undefined, mutate: vi.fn() });
    render(<RecurringList />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no recurring found', () => {
    mockUseApi.mockReturnValue({
      data: { subscriptions: [], installments: [], monthlyTotal: 0 },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });

    render(<RecurringList />);
    expect(screen.getByText('Nenhuma recorrência detectada')).toBeInTheDocument();
  });

  it('renders subscriptions and installments', () => {
    mockUseApi.mockReturnValue({
      data: {
        subscriptions: [
          { id: '1', merchant: 'Netflix', amount: 39.9, frequency: 'monthly', type: 'subscription', user_override: null, installments_remaining: null, next_expected_date: '2026-04-15', status: 'active' },
        ],
        installments: [
          { id: '2', merchant: 'Loja ABC', amount: 150, frequency: 'monthly', type: 'installment', user_override: null, installments_remaining: 4, next_expected_date: '2026-04-10', status: 'active' },
        ],
        monthlyTotal: 189.9,
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });

    render(<RecurringList />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Loja ABC')).toBeInTheDocument();
    expect(screen.getByText(/4 parcelas restantes/)).toBeInTheDocument();
  });

  it('shows reclassify buttons', () => {
    mockUseApi.mockReturnValue({
      data: {
        subscriptions: [
          { id: '1', merchant: 'Netflix', amount: 39.9, frequency: 'monthly', type: 'subscription', user_override: null, installments_remaining: null, next_expected_date: '2026-04-15', status: 'active' },
        ],
        installments: [],
        monthlyTotal: 39.9,
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });

    render(<RecurringList />);
    expect(screen.getByLabelText('Reclassificar Netflix como parcela')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RecurringList } from '@/components/recurring/recurring-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/recurring',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RecurringList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<RecurringList />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no recurring found', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ subscriptions: [], installments: [], monthlyTotal: 0 }),
    });

    render(<RecurringList />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma recorrência detectada')).toBeInTheDocument();
    });
  });

  it('renders subscriptions and installments', async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          subscriptions: [
            { id: '1', merchant: 'Netflix', amount: 39.9, frequency: 'monthly', type: 'subscription', installments_remaining: null, next_expected_date: '2026-04-15', status: 'active' },
          ],
          installments: [
            { id: '2', merchant: 'Loja ABC', amount: 150, frequency: 'monthly', type: 'installment', installments_remaining: 4, next_expected_date: '2026-04-10', status: 'active' },
          ],
          monthlyTotal: 189.9,
        }),
    });

    render(<RecurringList />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Loja ABC')).toBeInTheDocument();
      expect(screen.getByText('4 parcelas restantes')).toBeInTheDocument();
    });
  });
});

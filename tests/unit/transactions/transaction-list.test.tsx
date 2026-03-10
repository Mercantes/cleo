import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionList } from '@/components/transactions/transaction-list';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TransactionList />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no transactions', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: [], total: 0, page: 1, pageSize: 50 }),
    });

    render(<TransactionList />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument();
    });
  });

  it('should render transactions after loading', async () => {
    mockFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [
            {
              id: '1',
              description: 'Supermercado',
              amount: 150.0,
              date: '2026-03-10',
              type: 'debit',
              merchant: 'Pão de Açúcar',
              categories: { name: 'Alimentação', icon: '🍔' },
            },
          ],
          total: 1,
          page: 1,
          pageSize: 50,
        }),
    });

    render(<TransactionList />);

    await waitFor(() => {
      expect(screen.getByText('Pão de Açúcar')).toBeInTheDocument();
    });
  });
});

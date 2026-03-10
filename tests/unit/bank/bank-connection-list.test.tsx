import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// Mock react-pluggy-connect
vi.mock('react-pluggy-connect', () => ({
  PluggyConnect: () => null,
}));

// Mock Supabase browser client
const mockSelect = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    from: () => ({
      select: () => ({
        order: mockSelect,
      }),
    }),
  }),
}));

import { BankConnectionList } from '@/components/bank/bank-connection-list';

describe('BankConnectionList', () => {
  it('should render loading skeleton initially', () => {
    mockSelect.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<BankConnectionList />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no connections', async () => {
    mockSelect.mockResolvedValue({ data: [] });

    render(<BankConnectionList />);

    const emptyText = await screen.findByText(/nenhum banco conectado/i);
    expect(emptyText).toBeDefined();
  });

  it('should render bank connections', async () => {
    mockSelect.mockResolvedValue({
      data: [
        {
          id: 'conn-1',
          connector_name: 'Banco do Brasil',
          status: 'active',
          last_sync_at: '2026-03-10T10:00:00Z',
          accounts: [{ id: 'acc-1', name: 'Conta Corrente', type: 'checking', balance: 1500 }],
        },
      ],
    });

    render(<BankConnectionList />);

    const bankName = await screen.findByText('Banco do Brasil');
    expect(bankName).toBeDefined();

    const accountName = await screen.findByText('Conta Corrente');
    expect(accountName).toBeDefined();
  });
});

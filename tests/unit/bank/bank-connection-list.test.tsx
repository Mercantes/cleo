import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// Mock ConnectBankButton
vi.mock('@/components/bank/connect-bank-button', () => ({
  ConnectBankButton: () => <button>Conectar banco</button>,
}));

// Mock toast
vi.mock('@/components/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { BankList } from '@/components/settings/bank-list';

describe('BankList', () => {
  it('should render empty state when no connections', () => {
    render(<BankList connections={[]} onDisconnect={vi.fn()} />);

    expect(screen.getByText(/nenhum banco conectado/i)).toBeDefined();
  });

  it('should render bank connections', () => {
    const connections = [
      {
        id: 'conn-1',
        connector_name: 'Banco do Brasil',
        connector_logo_url: null,
        status: 'active',
        last_sync_at: '2026-03-10T10:00:00Z',
      },
    ];

    render(<BankList connections={connections} onDisconnect={vi.fn()} />);

    expect(screen.getByText('Banco do Brasil')).toBeDefined();
    expect(screen.getByText('Ativo')).toBeDefined();
  });

  it('should render multiple connections', () => {
    const connections = [
      {
        id: 'conn-1',
        connector_name: 'Banco do Brasil',
        connector_logo_url: null,
        status: 'active',
        last_sync_at: '2026-03-10T10:00:00Z',
      },
      {
        id: 'conn-2',
        connector_name: 'Nubank',
        connector_logo_url: 'https://example.com/nu.png',
        status: 'active',
        last_sync_at: null,
      },
    ];

    render(<BankList connections={connections} onDisconnect={vi.fn()} />);

    expect(screen.getByText('Banco do Brasil')).toBeDefined();
    expect(screen.getByText('Nubank')).toBeDefined();
    expect(screen.getByText('Nunca sincronizado')).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock useApi hook
const mockUseApi = vi.fn();
vi.mock('@/hooks/use-api', () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
}));

import { TierStatus } from '@/components/layout/tier-status';

describe('TierStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    mockUseApi.mockReturnValue({ data: undefined, isLoading: true, error: undefined });
    render(<TierStatus />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows Free tier with progress bars', () => {
    mockUseApi.mockReturnValue({
      data: {
        usage: [
          { feature: 'transactions', allowed: true, current: 50, limit: 100, tier: 'free' },
          { feature: 'chat', allowed: true, current: 10, limit: 30, tier: 'free' },
          { feature: 'bank_connections', allowed: true, current: 1, limit: 1, tier: 'free' },
        ],
      },
      isLoading: false,
      error: undefined,
    });

    render(<TierStatus />);

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Upgrade para Pro')).toBeInTheDocument();
    expect(screen.getByText('Transações')).toBeInTheDocument();
    expect(screen.getByText('Mensagens de chat')).toBeInTheDocument();
  });

  it('shows Pro badge without progress bars', () => {
    mockUseApi.mockReturnValue({
      data: {
        usage: [
          { feature: 'transactions', allowed: true, current: 0, limit: Infinity, tier: 'pro' },
          { feature: 'chat', allowed: true, current: 0, limit: Infinity, tier: 'pro' },
          { feature: 'bank_connections', allowed: true, current: 0, limit: Infinity, tier: 'pro' },
        ],
      },
      isLoading: false,
      error: undefined,
    });

    render(<TierStatus />);

    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade para Pro')).not.toBeInTheDocument();
  });
});

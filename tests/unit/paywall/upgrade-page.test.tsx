import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/hooks/use-tier', () => ({
  useTier: () => ({ tier: 'free', isPro: false, isLoading: false }),
}));

vi.mock('@/components/paywall/plan-comparison', () => ({
  PlanComparison: ({ onSelectPlan, currentTier }: { onSelectPlan: (plan: string) => void; currentTier?: string }) => (
    <div data-testid="plan-comparison" data-tier={currentTier}>
      <button onClick={() => onSelectPlan('pro')}>Mock Pro</button>
      <button onClick={() => onSelectPlan('premium')}>Mock Premium</button>
    </div>
  ),
}));

import UpgradePage from '@/app/(app)/upgrade/page';

describe('UpgradePage', () => {
  it('renders title and plan comparison', () => {
    render(<UpgradePage />);

    expect(screen.getByText('Faturamento e Assinatura')).toBeInTheDocument();
    expect(screen.getByTestId('plan-comparison')).toBeInTheDocument();
  });

  it('renders cancellation notice', () => {
    render(<UpgradePage />);
    expect(screen.getByText(/Cancele a qualquer momento/)).toBeInTheDocument();
  });

  it('passes currentTier to PlanComparison', () => {
    render(<UpgradePage />);
    expect(screen.getByTestId('plan-comparison').getAttribute('data-tier')).toBe('free');
  });
});

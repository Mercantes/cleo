import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/paywall/plan-comparison', () => ({
  PlanComparison: ({ onSelectPro }: { onSelectPro: () => void }) => (
    <div data-testid="plan-comparison">
      <button onClick={onSelectPro}>Mock Pro</button>
    </div>
  ),
}));

import UpgradePage from '@/app/(app)/upgrade/page';

describe('UpgradePage', () => {
  it('renders title and plan comparison', () => {
    render(<UpgradePage />);

    expect(screen.getByText('Escolha seu plano')).toBeInTheDocument();
    expect(screen.getByTestId('plan-comparison')).toBeInTheDocument();
  });

  it('renders cancellation notice', () => {
    render(<UpgradePage />);
    expect(screen.getByText(/Cancele a qualquer momento/)).toBeInTheDocument();
  });
});

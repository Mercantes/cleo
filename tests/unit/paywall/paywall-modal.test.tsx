import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { PaywallModal } from '@/components/paywall/paywall-modal';

describe('PaywallModal', () => {
  const defaultProps = {
    feature: 'chat',
    current: 30,
    limit: 30,
    onClose: vi.fn(),
  };

  it('renders feature-specific message for chat', () => {
    render(<PaywallModal {...defaultProps} />);
    expect(screen.getByText('Limite de mensagens atingido')).toBeInTheDocument();
    expect(screen.getByText('30/30')).toBeInTheDocument();
  });

  it('renders upgrade button', () => {
    render(<PaywallModal {...defaultProps} />);
    expect(screen.getByText('Upgrade para Pro')).toBeInTheDocument();
  });

  it('navigates to /upgrade on CTA click', () => {
    render(<PaywallModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Upgrade para Pro'));
    expect(mockPush).toHaveBeenCalledWith('/upgrade');
  });

  it('calls onClose when dismiss button is clicked', () => {
    const onClose = vi.fn();
    render(<PaywallModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Continuar no plano Free'));
    expect(onClose).toHaveBeenCalled();
  });
});

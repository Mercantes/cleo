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

import { ConnectBankButton } from '@/components/bank/connect-bank-button';

describe('ConnectBankButton', () => {
  it('should render the connect button', () => {
    render(<ConnectBankButton />);

    expect(screen.getByRole('button', { name: /conectar banco/i })).toBeDefined();
  });

  it('should not be disabled initially', () => {
    render(<ConnectBankButton />);

    const button = screen.getByRole('button', { name: /conectar banco/i });
    expect(button).not.toBeDisabled();
  });
});

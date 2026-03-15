import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectBankStep } from '@/components/onboarding/steps/connect-bank-step';

describe('ConnectBankStep', () => {
  it('renders step content', () => {
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('Conecte sua conta principal')).toBeInTheDocument();
    expect(screen.getByText('Conectar conta bancaria')).toBeInTheDocument();
    expect(screen.getByText('Pular por enquanto')).toBeInTheDocument();
  });

  it('shows personalized greeting when userName is provided', () => {
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={vi.fn()} userName="Maria" />);

    expect(screen.getByText('Ola, Maria!')).toBeInTheDocument();
  });

  it('shows security trust items', () => {
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText(/Criptografado com seguranca bancaria/)).toBeInTheDocument();
    expect(screen.getByText(/Acesso somente leitura/)).toBeInTheDocument();
    expect(screen.getByText(/Desconecte a qualquer momento/)).toBeInTheDocument();
  });

  it('calls onComplete when connect button clicked', () => {
    const onComplete = vi.fn();
    render(<ConnectBankStep onComplete={onComplete} onSkip={vi.fn()} />);

    fireEvent.click(screen.getByText('Conectar conta bancaria'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn();
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={onSkip} />);

    fireEvent.click(screen.getByText('Pular por enquanto'));
    expect(onSkip).toHaveBeenCalled();
  });
});

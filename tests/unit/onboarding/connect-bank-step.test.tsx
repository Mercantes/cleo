import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectBankStep } from '@/components/onboarding/steps/connect-bank-step';

describe('ConnectBankStep', () => {
  it('renders step content', () => {
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('Vamos conectar seu banco')).toBeInTheDocument();
    expect(screen.getByText('Conectar banco')).toBeInTheDocument();
    expect(screen.getByText('Pular por agora')).toBeInTheDocument();
  });

  it('shows personalized greeting when userName is provided', () => {
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={vi.fn()} userName="Maria" />);

    expect(screen.getByText('Olá, Maria!')).toBeInTheDocument();
  });

  it('shows security trust badges', () => {
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('Criptografia bancária')).toBeInTheDocument();
    expect(screen.getByText('Acesso somente leitura')).toBeInTheDocument();
    expect(screen.getByText('Desconecte quando quiser')).toBeInTheDocument();
  });

  it('calls onComplete when connect button clicked', () => {
    const onComplete = vi.fn();
    render(<ConnectBankStep onComplete={onComplete} onSkip={vi.fn()} />);

    fireEvent.click(screen.getByText('Conectar banco'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn();
    render(<ConnectBankStep onComplete={vi.fn()} onSkip={onSkip} />);

    fireEvent.click(screen.getByText('Pular por agora'));
    expect(onSkip).toHaveBeenCalled();
  });
});

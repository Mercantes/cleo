import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompleteProfileStep } from '@/components/onboarding/steps/complete-profile-step';

describe('CompleteProfileStep', () => {
  it('renders CPF input and buttons', () => {
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('Complete seu perfil')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
    expect(screen.getByText('Continuar')).toBeInTheDocument();
    expect(screen.getByText('Pular')).toBeInTheDocument();
  });

  it('shows personalized greeting when userName is provided', () => {
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={vi.fn()} userName="Joao" />);

    expect(screen.getByText('Joao, complete seu perfil')).toBeInTheDocument();
  });

  it('formats CPF as user types', () => {
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '52998224725' } });

    expect((input as HTMLInputElement).value).toBe('529.982.247-25');
  });

  it('shows error for invalid CPF on submit', async () => {
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '11111111111' } });
    fireEvent.submit(screen.getByText('Continuar'));

    expect(await screen.findByText('CPF invalido. Verifique o numero digitado.')).toBeInTheDocument();
  });

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn();
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={onSkip} />);

    fireEvent.click(screen.getByText('Pular'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('renders referral code field', () => {
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByPlaceholderText('CLEO-XXXXXXXX')).toBeInTheDocument();
    expect(screen.getByText(/Codigo de indicacao/)).toBeInTheDocument();
  });

  it('renders analytics consent toggle', () => {
    render(<CompleteProfileStep onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText(/analytics/)).toBeInTheDocument();
  });
});

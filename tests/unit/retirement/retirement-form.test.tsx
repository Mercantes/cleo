import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetirementForm } from '@/components/retirement/retirement-form';

describe('RetirementForm', () => {
  const defaultValues = { targetMonthlyIncome: 5000, annualReturnRate: 0.08, currentPortfolio: 0 };

  it('renders form fields', () => {
    render(<RetirementForm values={defaultValues} onChange={vi.fn()} onSubmit={vi.fn()} loading={false} />);
    expect(screen.getByText('Parâmetros')).toBeDefined();
    expect(screen.getByText('Calcular')).toBeDefined();
  });

  it('calls onSubmit when button clicked', () => {
    const onSubmit = vi.fn();
    render(<RetirementForm values={defaultValues} onChange={vi.fn()} onSubmit={onSubmit} loading={false} />);
    fireEvent.click(screen.getByText('Calcular'));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('disables button when loading', () => {
    render(<RetirementForm values={defaultValues} onChange={vi.fn()} onSubmit={vi.fn()} loading={true} />);
    expect(screen.getByText('Calculando...')).toBeDefined();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanComparison } from '@/components/paywall/plan-comparison';

describe('PlanComparison', () => {
  it('renders Free and Pro plans', () => {
    render(<PlanComparison onSelectPro={vi.fn()} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Recomendado')).toBeInTheDocument();
  });

  it('displays feature rows', () => {
    render(<PlanComparison onSelectPro={vi.fn()} />);

    expect(screen.getAllByText('Transações por mês').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mensagens de chat IA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Conexões bancárias').length).toBeGreaterThanOrEqual(1);
  });

  it('shows current plan button as disabled', () => {
    render(<PlanComparison onSelectPro={vi.fn()} />);

    const currentButton = screen.getByText('Plano atual');
    expect(currentButton).toBeDisabled();
  });

  it('calls onSelectPro when Pro button clicked', () => {
    const onSelectPro = vi.fn();
    render(<PlanComparison onSelectPro={onSelectPro} />);

    fireEvent.click(screen.getByText('Começar Pro'));
    expect(onSelectPro).toHaveBeenCalled();
  });
});

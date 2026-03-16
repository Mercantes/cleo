import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanComparison } from '@/components/paywall/plan-comparison';

describe('PlanComparison', () => {
  it('renders all three plans (Free, Pro, Premium)', () => {
    render(<PlanComparison onSelectPlan={vi.fn()} />);

    expect(screen.getAllByText('Grátis').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Premium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('MELHOR OFERTA')).toBeInTheDocument();
  });

  it('displays feature rows', () => {
    render(<PlanComparison onSelectPlan={vi.fn()} />);

    expect(screen.getAllByText('Categorização automática de transações').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Assistente de IA').length).toBeGreaterThanOrEqual(1);
  });

  it('shows current plan button as disabled for free tier', () => {
    render(<PlanComparison onSelectPlan={vi.fn()} currentTier="free" />);

    const currentButton = screen.getByText('Plano Atual');
    expect(currentButton).toBeDisabled();
  });

  it('shows current plan button as disabled for pro tier', () => {
    render(<PlanComparison onSelectPlan={vi.fn()} currentTier="pro" />);

    const currentButtons = screen.getAllByText('Plano Atual');
    expect(currentButtons.length).toBe(1);
    expect(currentButtons[0]).toBeDisabled();
  });

  it('calls onSelectPlan with "pro" when Pro button clicked', () => {
    const onSelectPlan = vi.fn();
    render(<PlanComparison onSelectPlan={onSelectPlan} currentTier="free" />);

    // Both Pro and Premium show "Teste grátis" for free tier
    const buttons = screen.getAllByText('Teste grátis');
    fireEvent.click(buttons[0]);
    expect(onSelectPlan).toHaveBeenCalledWith('pro');
  });

  it('calls onSelectPlan with "premium" when Premium button clicked', () => {
    const onSelectPlan = vi.fn();
    render(<PlanComparison onSelectPlan={onSelectPlan} currentTier="free" />);

    const buttons = screen.getAllByText('Teste grátis');
    fireEvent.click(buttons[1]);
    expect(onSelectPlan).toHaveBeenCalledWith('premium');
  });
});

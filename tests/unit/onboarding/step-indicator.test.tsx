import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepIndicator } from '@/components/onboarding/step-indicator';

describe('StepIndicator', () => {
  it('renders all step labels', () => {
    render(<StepIndicator currentStep={0} completedSteps={[]} />);

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Banco')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
    expect(screen.getByText('Metas')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    render(<StepIndicator currentStep={1} completedSteps={[0]} />);

    // Step 2 (index 1) should show number "2"
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows check for completed steps', () => {
    render(<StepIndicator currentStep={2} completedSteps={[0, 1]} />);

    // Completed steps should not show numbers
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    // Current step shows number
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

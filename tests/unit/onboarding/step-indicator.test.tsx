import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepIndicator } from '@/components/onboarding/step-indicator';

describe('StepIndicator', () => {
  it('renders 4 step dots', () => {
    render(<StepIndicator currentStep={0} completedSteps={[]} />);

    const dots = screen.getAllByRole('img');
    expect(dots).toHaveLength(4);
  });

  it('marks current step as active', () => {
    render(<StepIndicator currentStep={1} completedSteps={[0]} />);

    const dots = screen.getAllByRole('img');
    // Current step (index 1) should have the wider class
    expect(dots[1].className).toContain('w-8');
    expect(dots[1].className).toContain('bg-primary');
  });

  it('marks completed steps', () => {
    render(<StepIndicator currentStep={2} completedSteps={[0, 1]} />);

    const dots = screen.getAllByRole('img');
    expect(dots[0].className).toContain('bg-primary/60');
    expect(dots[1].className).toContain('bg-primary/60');
    expect(dots[2].className).toContain('w-8');
  });
});

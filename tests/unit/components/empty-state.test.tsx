import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Landmark } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

describe('EmptyState', () => {
  it('should render title and description', () => {
    render(
      <EmptyState
        icon={Landmark}
        title="Test Title"
        description="Test description text"
      />,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description text')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    render(
      <EmptyState
        icon={Landmark}
        title="Title"
        description="Description"
        action={{ label: 'Click me' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should render disabled action button', () => {
    render(
      <EmptyState
        icon={Landmark}
        title="Title"
        description="Description"
        action={{ label: 'Disabled', disabled: true }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('should not render action button when not provided', () => {
    render(
      <EmptyState icon={Landmark} title="Title" description="Description" />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

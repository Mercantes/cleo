import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from '@/app/(app)/settings/page';

vi.mock('@/components/settings/settings-content', () => ({
  SettingsContent: () => <div data-testid="settings-content">Settings Content</div>,
}));

describe('SettingsPage', () => {
  it('renders page title and description', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(
      screen.getByText(/Gerencie seu perfil, conexões bancárias/),
    ).toBeInTheDocument();
  });

  it('renders SettingsContent component', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('settings-content')).toBeInTheDocument();
  });
});

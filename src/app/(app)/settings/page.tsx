import type { Metadata } from 'next';
import { SettingsContent } from '@/components/settings/settings-content';

export const metadata: Metadata = {
  title: 'Configurações',
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu perfil, conexões bancárias e preferências.
        </p>
      </div>

      <SettingsContent />
    </div>
  );
}

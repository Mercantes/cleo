import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function SettingsPage() {
  return (
    <EmptyState
      icon={Settings}
      title="Configurações"
      description="Gerencie seu perfil, preferências de notificação, conexões bancárias e configurações de segurança."
    />
  );
}

import { Landmark } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function DashboardPage() {
  return (
    <EmptyState
      icon={Landmark}
      title="Conecte seu banco para começar"
      description="Vincule suas contas bancárias para ver suas transações, receber insights da IA e projetar seu futuro financeiro."
      action={{ label: 'Conectar banco', disabled: true }}
    />
  );
}

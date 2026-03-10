import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function ProjectionsPage() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="Projeções financeiras em breve"
      description="Visualize projeções de gastos, receitas e metas financeiras baseadas no seu histórico de transações."
    />
  );
}

import { ArrowLeftRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function TransactionsPage() {
  return (
    <EmptyState
      icon={ArrowLeftRight}
      title="Suas transações aparecerão aqui"
      description="Conecte seu banco para visualizar, categorizar e analisar todas as suas transações em um só lugar."
    />
  );
}

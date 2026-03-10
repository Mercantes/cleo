import { Landmark } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ConnectBankButton } from '@/components/bank/connect-bank-button';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <EmptyState
        icon={Landmark}
        title="Conecte seu banco para começar"
        description="Vincule suas contas bancárias para ver suas transações, receber insights da IA e projetar seu futuro financeiro."
      />
      <div className="mt-4">
        <ConnectBankButton />
      </div>
    </div>
  );
}

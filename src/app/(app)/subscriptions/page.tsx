import type { Metadata } from 'next';
import { RecurringList } from '@/components/recurring/recurring-list';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Recorrentes' };

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recorrentes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe suas assinaturas e parcelas mensais.
        </p>
      </div>
      <ProGate feature="Detecção de parcelas e assinaturas">
        <RecurringList />
      </ProGate>
    </div>
  );
}

import type { Metadata } from 'next';
import { RecurringList } from '@/components/recurring/recurring-list';

export const metadata: Metadata = {
  title: 'Recorrentes',
};

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recorrentes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe suas assinaturas e parcelas mensais.
        </p>
      </div>
      <RecurringList />
    </div>
  );
}

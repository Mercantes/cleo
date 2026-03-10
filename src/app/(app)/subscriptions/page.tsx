import { RecurringList } from '@/components/recurring/recurring-list';

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinaturas & Parcelas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja seus compromissos mensais recorrentes.
        </p>
      </div>
      <RecurringList />
    </div>
  );
}

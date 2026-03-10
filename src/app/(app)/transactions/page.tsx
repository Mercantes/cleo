import { TransactionList } from '@/components/transactions/transaction-list';

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize e filtre todas as suas transações.
        </p>
      </div>
      <TransactionList />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { TransactionList } from '@/components/transactions/transaction-list';

export const metadata: Metadata = {
  title: 'Transações',
};

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize e filtre todas as suas transações.
          </p>
        </div>
        <Link
          href="/import"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Upload className="h-4 w-4" />
          Importar
        </Link>
      </div>
      <TransactionList />
    </div>
  );
}

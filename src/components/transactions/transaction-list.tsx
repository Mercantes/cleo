'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TransactionItem } from './transaction-item';
import { TransactionFilters } from './transaction-filters';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  merchant: string | null;
  categories: { name: string; icon: string } | null;
}

interface Filters {
  search?: string;
  from?: string;
  to?: string;
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({});

  const fetchTransactions = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      const params = new URLSearchParams({ page: String(pageNum) });
      if (filters.search) params.set('search', filters.search);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      try {
        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) throw new Error('Falha ao carregar transações');
        const data = await response.json();

        if (append) {
          setTransactions((prev) => [...prev, ...data.data]);
        } else {
          setTransactions(data.data);
        }
        setTotal(data.total);
        setError(null);
      } catch {
        if (!append) setError('Não foi possível carregar suas transações. Tente novamente.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, [fetchTransactions]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  }

  const hasMore = transactions.length < total;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Erro ao carregar"
        description={error}
        action={{
          label: 'Tentar novamente',
          onClick: () => fetchTransactions(1),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <TransactionFilters onFiltersChange={setFilters} />

      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Nenhuma transação encontrada"
          description={
            filters.search || filters.from || filters.to
              ? 'Tente ajustar os filtros para encontrar transações.'
              : 'Conecte seu banco para importar suas transações.'
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                description={tx.description}
                amount={tx.amount}
                date={tx.date}
                type={tx.type}
                category={tx.categories}
                merchant={tx.merchant}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Carregar mais
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

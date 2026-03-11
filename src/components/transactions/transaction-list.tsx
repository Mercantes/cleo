'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Download, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TransactionItem } from './transaction-item';
import { TransactionFilters } from './transaction-filters';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateGroupLabel } from '@/lib/utils/format';

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
  type?: string;
  category?: string;
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
      if (filters.type) params.set('type', filters.type);
      if (filters.category) params.set('category', filters.category);

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

  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const tx of transactions) {
      if (tx.type === 'credit') income += tx.amount;
      else expenses += Math.abs(tx.amount);
    }
    return { income, expenses };
  }, [transactions]);

  function exportCSV() {
    const header = 'Data,Descrição,Categoria,Tipo,Valor\n';
    const rows = transactions
      .map((tx) => {
        const date = tx.date;
        const desc = tx.description.replace(/"/g, '""');
        const cat = tx.categories?.name || 'Sem categoria';
        const type = tx.type === 'credit' ? 'Receita' : 'Despesa';
        const amount = tx.amount.toFixed(2);
        return `${date},"${desc}","${cat}",${type},${amount}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleo-transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

      {transactions.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex gap-4 text-sm">
            <span>
              Receitas: <strong className="text-green-600 dark:text-green-400">{formatCurrency(summary.income)}</strong>
            </span>
            <span>
              Despesas: <strong className="text-red-500 dark:text-red-400">{formatCurrency(summary.expenses)}</strong>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={exportCSV} className="gap-1 text-xs">
            <Download className="h-3 w-3" />
            CSV
          </Button>
        </div>
      )}

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
          <div className="space-y-4">
            {(() => {
              const groups: { label: string; items: Transaction[] }[] = [];
              for (const tx of transactions) {
                const label = formatDateGroupLabel(tx.date);
                const last = groups[groups.length - 1];
                if (last && last.label === label) {
                  last.items.push(tx);
                } else {
                  groups.push({ label, items: [tx] });
                }
              }
              return groups.map((group) => (
                <div key={group.label}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((tx) => (
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
                </div>
              ));
            })()}
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

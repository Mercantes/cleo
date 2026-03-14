'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Download, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  category_id: string | null;
  categories: { name: string; icon: string } | null;
}

interface Filters {
  search?: string;
  from?: string;
  to?: string;
  type?: string;
  category?: string;
}

type FlatItem =
  | { kind: 'header'; label: string }
  | { kind: 'tx'; tx: Transaction };

function VirtualizedTransactionList({
  transactions,
  searchQuery,
  onCategoryChange,
}: {
  transactions: Transaction[];
  searchQuery: string;
  onCategoryChange: (txId: string, catId: string, cat: { name: string; icon: string }) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    let lastLabel = '';
    for (const tx of transactions) {
      const label = formatDateGroupLabel(tx.date);
      if (label !== lastLabel) {
        items.push({ kind: 'header', label });
        lastLabel = label;
      }
      items.push({ kind: 'tx', tx });
    }
    return items;
  }, [transactions]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (flatItems[index].kind === 'header' ? 32 : 68),
    overscan: 10,
  });

  // Only use virtualization for large lists (100+)
  if (transactions.length < 100) {
    return (
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
                    id={tx.id}
                    description={tx.description}
                    amount={tx.amount}
                    date={tx.date}
                    type={tx.type}
                    category={tx.categories}
                    categoryId={tx.category_id}
                    merchant={tx.merchant}
                    searchQuery={searchQuery}
                    onCategoryChange={onCategoryChange}
                  />
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="max-h-[70vh] overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}
      >
        {virtualizer.getVirtualItems().map((vItem) => {
          const item = flatItems[vItem.index];
          return (
            <div
              key={vItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vItem.start}px)`,
              }}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
            >
              {item.kind === 'header' ? (
                <h3 className="pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:pt-0">
                  {item.label}
                </h3>
              ) : (
                <div className="pb-2">
                  <TransactionItem
                    id={item.tx.id}
                    description={item.tx.description}
                    amount={item.tx.amount}
                    date={item.tx.date}
                    type={item.tx.type}
                    category={item.tx.categories}
                    categoryId={item.tx.category_id}
                    merchant={item.tx.merchant}
                    searchQuery={searchQuery}
                    onCategoryChange={onCategoryChange}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const filtersRef = useRef<Filters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = useCallback(
    async (currentFilters: Filters, pageNum: number, append = false) => {
      if (append) setIsLoadingMore(true);

      const params = new URLSearchParams({ page: String(pageNum) });
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.from) params.set('from', currentFilters.from);
      if (currentFilters.to) params.set('to', currentFilters.to);
      if (currentFilters.type) params.set('type', currentFilters.type);
      if (currentFilters.category) params.set('category', currentFilters.category);

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
        setIsInitialLoad(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchTransactions({}, 1);
  }, [fetchTransactions]);

  const handleFiltersChange = useCallback(
    (newFilters: Filters) => {
      const prev = filtersRef.current;
      if (
        prev.search === newFilters.search &&
        prev.from === newFilters.from &&
        prev.to === newFilters.to &&
        prev.type === newFilters.type &&
        prev.category === newFilters.category
      ) {
        return;
      }
      filtersRef.current = newFilters;
      setHasActiveFilters(!!(newFilters.search || newFilters.from || newFilters.to || newFilters.type || newFilters.category));
      setSearchQuery(newFilters.search || '');
      setPage(1);
      fetchTransactions(newFilters, 1);
    },
    [fetchTransactions],
  );

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(filtersRef.current, nextPage, true);
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

  if (isInitialLoad) {
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
          onClick: () => fetchTransactions(filtersRef.current, 1),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
        <TransactionFilters onFiltersChange={handleFiltersChange} />
      </Suspense>

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
            hasActiveFilters
              ? 'Tente ajustar os filtros para encontrar transações.'
              : 'Conecte seu banco para importar suas transações.'
          }
        />
      ) : (
        <>
          <VirtualizedTransactionList
            transactions={transactions}
            searchQuery={searchQuery}
            onCategoryChange={(txId, _catId, cat) => {
              setTransactions((prev) =>
                prev.map((t) =>
                  t.id === txId ? { ...t, categories: cat } : t,
                ),
              );
            }}
          />

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

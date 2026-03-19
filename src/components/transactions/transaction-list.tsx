'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, ArrowDown, ArrowUp, ChevronDown, ChevronUp, Loader2, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TransactionRow } from './transaction-item';
import { TransactionFilters } from './transaction-filters';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { cn } from '@/lib/utils';

interface AccountInfo {
  id: string;
  name: string;
  type: string;
  bank_connections: {
    connector_name: string;
    connector_logo_url: string | null;
  } | null;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  merchant: string | null;
  category_id: string | null;
  account_id: string | null;
  categories: { name: string; icon: string } | null;
  accounts: AccountInfo | null;
}

interface Filters {
  search?: string;
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  bank?: string;
}

export function TransactionList() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const filtersRef = useRef<Filters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<{ income: number; expenses: number; balance: number }>({ income: 0, expenses: 0, balance: 0 });
  const [sortColumn, setSortColumn] = useState<'description' | 'category' | 'account' | 'date' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Third click resets to default (no sort)
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection(column === 'amount' || column === 'date' ? 'desc' : 'asc');
    }
  }

  const sortedTransactions = useMemo(() => {
    if (!sortColumn) return transactions;
    return [...transactions].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'description':
          cmp = (a.merchant || a.description).localeCompare(b.merchant || b.description, 'pt-BR');
          break;
        case 'category':
          cmp = (a.categories?.name || 'zzz').localeCompare(b.categories?.name || 'zzz', 'pt-BR');
          break;
        case 'account': {
          const aName = a.accounts?.bank_connections?.connector_name || a.accounts?.name || 'zzz';
          const bName = b.accounts?.bank_connections?.connector_name || b.accounts?.name || 'zzz';
          cmp = aName.localeCompare(bName, 'pt-BR');
          break;
        }
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [transactions, sortColumn, sortDirection]);

  const fetchTransactions = useCallback(
    async (currentFilters: Filters, pageNum: number, append = false) => {
      if (append) setIsLoadingMore(true);

      const params = new URLSearchParams({ page: String(pageNum) });
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.from) params.set('from', currentFilters.from);
      if (currentFilters.to) params.set('to', currentFilters.to);
      if (currentFilters.type) params.set('type', currentFilters.type);
      if (currentFilters.category) params.set('category', currentFilters.category);
      if (currentFilters.bank) params.set('bank', currentFilters.bank);

      try {
        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) throw new Error('Falha ao carregar transações');
        const data = await response.json();

        if (append) {
          setTransactions((prev) => [...prev, ...data.data]);
        } else {
          setTransactions(data.data);
          if (data.summary) {
            setSummary(data.summary);
          }
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
        prev.category === newFilters.category &&
        prev.bank === newFilters.bank
      ) {
        return;
      }
      filtersRef.current = newFilters;
      setHasActiveFilters(!!(newFilters.search || newFilters.from || newFilters.to || newFilters.type || newFilters.category || newFilters.bank));
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

  function exportCSV() {
    const params = new URLSearchParams();
    const f = filtersRef.current;
    if (f.from) params.set('from', f.from);
    if (f.to) params.set('to', f.to);
    const qs = params.toString();
    const url = `/api/transactions/export${qs ? `?${qs}` : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.click();
  }

  const hasMore = transactions.length < total;

  if (isInitialLoad) {
    return (
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted" />
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
        <TransactionFilters onFiltersChange={handleFiltersChange} onExportCSV={exportCSV} />
      </Suspense>

      {/* Summary stats bar */}
      {transactions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span className="font-semibold text-foreground">{total}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <ArrowDown className="h-3.5 w-3.5 text-red-500" />
              <span className="font-semibold text-red-500 dark:text-red-400">
                {fmt(summary.expenses)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUp className="h-3.5 w-3.5 text-green-500" />
              <span className="font-semibold text-green-600 dark:text-green-400">
                {fmt(summary.income)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className={cn(
                'font-semibold',
                summary.balance >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400',
              )}>
                {fmt(summary.balance)}
              </span>
            </div>
          </div>
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
          {/* Desktop table view */}
          <div className="hidden md:block">
            <div className="rounded-lg border bg-card" role="table" aria-label="Lista de transações">
              {/* Table header */}
              <div role="row" className="grid grid-cols-[2.5rem_1fr_10rem_8rem_10rem_7rem_2.5rem] items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span role="columnheader" className="text-center">N.°</span>
                {(['description', 'category', 'account', 'date', 'amount'] as const).map((col) => {
                  const labels = { description: 'Descrição', category: 'Categoria', account: 'Conta', date: 'Data', amount: 'Valor' };
                  const align = col === 'amount' ? 'justify-end' : col === 'account' ? 'justify-center' : '';
                  const isActive = sortColumn === col;
                  return (
                    <button
                      key={col}
                      role="columnheader"
                      onClick={() => handleSort(col)}
                      className={cn(
                        'flex items-center gap-1 transition-colors hover:text-foreground',
                        align,
                        isActive && 'text-foreground',
                      )}
                    >
                      {labels[col]}
                      {isActive && (sortDirection === 'asc'
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  );
                })}
                <span role="columnheader" aria-hidden="true" />
              </div>
              {/* Rows */}
              {sortedTransactions.map((tx, index) => (
                <TransactionRow
                  key={tx.id}
                  index={index + 1}
                  id={tx.id}
                  description={tx.description}
                  amount={tx.amount}
                  date={tx.date}
                  type={tx.type}
                  category={tx.categories}
                  categoryId={tx.category_id}
                  merchant={tx.merchant}
                  account={tx.accounts}
                  searchQuery={searchQuery}
                  onCategoryChange={(txId, _catId, cat) => {
                    setTransactions((prev) =>
                      prev.map((t) =>
                        t.id === txId ? { ...t, categories: cat } : t,
                      ),
                    );
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mobile card view */}
          <div className="space-y-2 md:hidden">
            {sortedTransactions.map((tx, index) => (
              <TransactionRow
                key={tx.id}
                index={index + 1}
                id={tx.id}
                description={tx.description}
                amount={tx.amount}
                date={tx.date}
                type={tx.type}
                category={tx.categories}
                categoryId={tx.category_id}
                merchant={tx.merchant}
                account={tx.accounts}
                searchQuery={searchQuery}
                mobile
                onCategoryChange={(txId, _catId, cat) => {
                  setTransactions((prev) =>
                    prev.map((t) =>
                      t.id === txId ? { ...t, categories: cat } : t,
                    ),
                  );
                }}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Carregar mais
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Mostrando {transactions.length} de {total}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Repeat,
  CreditCard,
  Loader2,
  MessageSquare,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  X,
  Plus,
  Search,
  Pencil,
  Check,
  Download,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

import { cleanMerchantName } from '@/lib/finance/recurring-detector';

interface RecurringItem {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  type: 'subscription' | 'installment' | 'income';
  user_override: string | null;
  installments_remaining: number | null;
  next_expected_date: string;
  status: string;
  confidence: 'high' | 'medium' | 'low';
  occurrences: number;
}

interface RecurringData {
  subscriptions: RecurringItem[];
  installments: RecurringItem[];
  income: RecurringItem[];
  monthlyTotal: number;
  monthlyIncome: number;
}

type Tab = 'expenses' | 'income';
type SortBy = 'amount' | 'name' | 'confidence' | 'occurrences';

const TYPE_LABELS = { subscription: 'assinatura', installment: 'parcela', income: 'receita' } as const;
const TYPE_ORDER: Array<'subscription' | 'installment' | 'income'> = ['subscription', 'installment', 'income'];

function nextTypeLabel(currentType: 'subscription' | 'installment' | 'income'): string {
  const nextType = TYPE_ORDER[(TYPE_ORDER.indexOf(currentType) + 1) % TYPE_ORDER.length];
  return TYPE_LABELS[nextType];
}

const CONFIDENCE_RANK = { high: 0, medium: 1, low: 2 } as const;

function sortItems<T extends RecurringItem>(items: T[], sortBy: SortBy): T[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name': return cleanMerchantName(a.merchant).localeCompare(cleanMerchantName(b.merchant));
      case 'confidence': return CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
      case 'occurrences': return b.occurrences - a.occurrences;
      case 'amount':
      default: return Number(b.amount) - Number(a.amount);
    }
  });
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function RingChart({ paidPercent }: { paidPercent: number }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = (paidPercent / 100) * circumference;
  const size = (radius + stroke) * 2;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/50"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - filled}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-primary transition-all"
      />
    </svg>
  );
}

function AmountDisplay({ item, hideValues, editingId, editAmount, setEditingId, setEditAmount, onSave }: {
  item: RecurringItem;
  hideValues: boolean;
  editingId: string | null;
  editAmount: string;
  setEditingId: (id: string | null) => void;
  setEditAmount: (v: string) => void;
  onSave: (item: RecurringItem) => void;
  }) {
  const isEditing = editingId === item.id;
  const isIncome = item.type === 'income';

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">R$</span>
        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(item); if (e.key === 'Escape') setEditingId(null); }}
          className="w-20 rounded border bg-background px-1.5 py-0.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          min="0"
          step="0.01"
          autoFocus
        />
        <button onClick={() => onSave(item)} className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950">
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group/amount">
      <span className={cn('shrink-0 text-sm font-semibold', isIncome && 'text-emerald-600 dark:text-emerald-400')}>
        {isIncome ? '+' : ''}{hideValues ? HIDDEN_VALUE : formatCurrency(item.amount)}
      </span>
      <button
        onClick={() => { setEditingId(item.id); setEditAmount(String(item.amount)); }}
        className="rounded p-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover/amount:opacity-100 sm:opacity-0 max-sm:opacity-60"
        title="Editar valor"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

function formatEndDate(dateStr: string, remaining: number | null) {
  if (!remaining || !dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  // Estimate end date: next_expected_date + remaining months
  const end = new Date(d.getFullYear(), d.getMonth() + remaining, d.getDate());
  return `até ${end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}`;
}

export function RecurringList() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);
  const router = useRouter();
  const { data, isLoading, error: fetchError, mutate } = useApi<RecurringData>('/api/recurring');
  const [isDetecting, setIsDetecting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('expenses');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ merchant: '', amount: '', type: 'subscription' as 'subscription' | 'installment' | 'income' });
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('amount');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Escape key closes modal
  useEffect(() => {
    if (!showAddForm) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddForm(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showAddForm]);

  // Animate modal in
  useEffect(() => {
    if (showAddForm) {
      requestAnimationFrame(() => setModalVisible(true));
    } else {
      setModalVisible(false);
    }
  }, [showAddForm]);

  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const viewDate = useMemo(() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1), [monthOffset]); // eslint-disable-line react-hooks/exhaustive-deps
  const monthLabel = `${MONTHS[viewDate.getMonth()]} de ${viewDate.getFullYear()}`;

  const rawSubscriptions = data?.subscriptions || [];
  const rawInstallments = data?.installments || [];
  const rawIncome = data?.income || [];
  const rawMonthlyTotal = data?.monthlyTotal || 0;
  const rawMonthlyIncome = data?.monthlyIncome || 0;
  const hasExpenseData = rawSubscriptions.length > 0 || rawInstallments.length > 0;
  const hasIncomeData = rawIncome.length > 0;
  const hasAnyData = hasExpenseData || hasIncomeData;

  // Filter by search query
  const filterBySearch = useCallback((items: RecurringItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => cleanMerchantName(i.merchant).toLowerCase().includes(q));
  }, [searchQuery]);

  // Filter recurring items by selected month: show items active during viewDate month
  const filterByMonth = useCallback((items: RecurringItem[]) => {
    return items.filter((item) => {
      if (!item.next_expected_date) return true;
      const viewYear = viewDate.getFullYear();
      const viewMonth = viewDate.getMonth();
      const nextDate = new Date(item.next_expected_date + 'T12:00:00');
      const nextYear = nextDate.getFullYear();
      const nextMonth = nextDate.getMonth();
      // Item is relevant if next_expected_date is in the view month or later
      if (nextYear > viewYear || (nextYear === viewYear && nextMonth >= viewMonth)) return true;
      return false;
    });
  }, [viewDate]);

  // Apply search + month filter + sort
  const subscriptions = useMemo(() => sortItems(filterByMonth(filterBySearch(rawSubscriptions)), sortBy), [rawSubscriptions, searchQuery, sortBy, viewDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const installments = useMemo(() => sortItems(filterByMonth(filterBySearch(rawInstallments)), sortBy), [rawInstallments, searchQuery, sortBy, viewDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const income = useMemo(() => sortItems(filterByMonth(filterBySearch(rawIncome)), sortBy), [rawIncome, searchQuery, sortBy, viewDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate totals based on filtered items
  const monthlyIncome = useMemo(() => income.reduce((s, i) => s + Number(i.amount), 0), [income]);

  // Auto-detect recurring transactions when data loads empty
  const autoDetectRan = useRef(false);
  useEffect(() => {
    if (!isLoading && data && !hasAnyData && !autoDetectRan.current && !isDetecting) {
      autoDetectRan.current = true;
      handleDetect();
    }
  }, [isLoading, data, hasAnyData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate summary values
  const installmentsTotal = installments.reduce((s, i) => s + Number(i.amount), 0);
  const subscriptionsTotal = subscriptions.reduce((s, i) => s + Number(i.amount), 0);
  const monthlyTotal = installmentsTotal + subscriptionsTotal;
  // For the ring chart, we simulate "paid" as 0 (beginning of month) for simplicity
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const paidPercent = monthOffset === 0 ? Math.round((dayOfMonth / daysInMonth) * 100) : monthOffset < 0 ? 100 : 0;

  // Installments remaining total
  const installmentsRemainingTotal = installments.reduce((s, i) => s + Number(i.amount) * (i.installments_remaining || 1), 0);

  async function handleDetect() {
    setIsDetecting(true);
    try {
      const res = await fetch('/api/recurring/detect', { method: 'POST' });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Recorrências atualizadas');
    } catch {
      toast.error('Não foi possível detectar recorrências. Tente novamente.');
    } finally {
      setIsDetecting(false);
    }
  }

  const handleToggleType = useCallback(async (item: RecurringItem) => {
    const typeOrder: Array<'subscription' | 'installment' | 'income'> = ['subscription', 'installment', 'income'];
    const currentIdx = typeOrder.indexOf(item.type);
    const newType = typeOrder[(currentIdx + 1) % typeOrder.length];
    setTogglingId(item.id);

    if (data) {
      const allItems = [...data.subscriptions, ...data.installments, ...data.income];
      const updated = allItems.map(i => i.id === item.id ? { ...i, type: newType as 'subscription' | 'installment' | 'income' } : i);
      mutate({
        subscriptions: updated.filter(i => i.type === 'subscription'),
        installments: updated.filter(i => i.type === 'installment'),
        income: updated.filter(i => i.type === 'income'),
        monthlyTotal: data.monthlyTotal,
        monthlyIncome: data.monthlyIncome,
      }, false);
    }

    try {
      const res = await fetch('/api/recurring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, type: newType }),
      });
      if (!res.ok) throw new Error();
      const labels = { subscription: 'assinatura', installment: 'parcela', income: 'receita' };
      toast.success(`Marcado como ${labels[newType]}`);
    } catch {
      await mutate();
      toast.error('Erro ao atualizar classificação');
    } finally {
      setTogglingId(null);
    }
  }, [data, mutate]);

  const handleDismiss = useCallback(async (item: RecurringItem) => {
    // Optimistic removal
    if (data) {
      mutate({
        subscriptions: data.subscriptions.filter(i => i.id !== item.id),
        installments: data.installments.filter(i => i.id !== item.id),
        income: data.income.filter(i => i.id !== item.id),
        monthlyTotal: item.type !== 'income' ? data.monthlyTotal - Number(item.amount) : data.monthlyTotal,
        monthlyIncome: item.type === 'income' ? data.monthlyIncome - Number(item.amount) : data.monthlyIncome,
      }, false);
    }

    try {
      const res = await fetch('/api/recurring', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Recorrência descartada');
    } catch {
      await mutate();
      toast.error('Erro ao descartar recorrência');
    }
  }, [data, mutate]);

  async function handleEditAmount(item: RecurringItem) {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;
    setEditingId(null);

    // Optimistic update
    if (data) {
      const updateItem = (i: RecurringItem) => i.id === item.id ? { ...i, amount: newAmount } : i;
      mutate({
        subscriptions: data.subscriptions.map(updateItem),
        installments: data.installments.map(updateItem),
        income: data.income.map(updateItem),
        monthlyTotal: data.monthlyTotal,
        monthlyIncome: data.monthlyIncome,
      }, false);
    }

    try {
      const res = await fetch('/api/recurring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, amount: newAmount }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Valor atualizado');
    } catch {
      await mutate();
      toast.error('Erro ao atualizar valor');
    }
  }

  // Balance overview
  const balance = monthlyIncome - monthlyTotal;

  function handleExportCSV() {
    const allItems = [...rawSubscriptions, ...rawInstallments, ...rawIncome];
    if (allItems.length === 0) return;
    const header = 'Nome,Tipo,Valor,Frequência,Confiança,Ocorrências';
    const typeLabels: Record<string, string> = { subscription: 'Assinatura', installment: 'Parcela', income: 'Receita' };
    const rows = allItems.map(i =>
      `"${cleanMerchantName(i.merchant)}","${typeLabels[i.type] || i.type}",${Number(i.amount).toFixed(2)},"${i.frequency}","${i.confidence}",${i.occurrences}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recorrencias.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  }

  async function handleAdd() {
    if (!addForm.merchant.trim() || !addForm.amount) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: addForm.merchant.trim(),
          amount: parseFloat(addForm.amount),
          type: addForm.type,
        }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      setAddForm({ merchant: '', amount: '', type: 'subscription' });
      setShowAddForm(false);
      toast.success('Recorrência adicionada');
    } catch {
      toast.error('Erro ao adicionar recorrência');
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs + Add button */}
      <div className="flex items-center border-b">
        <button
          onClick={() => setTab('expenses')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'expenses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <TrendingDown className="h-4 w-4" />
          Despesas
        </button>
        <button
          onClick={() => setTab('income')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'income'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Receitas
        </button>
        <button
          onClick={() => { setAddForm(f => ({ ...f, type: tab === 'income' ? 'income' : 'subscription' })); setShowAddForm(true); }}
          className="ml-auto mb-0.5 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </button>
      </div>

      {/* Search & Sort bar */}
      {hasAnyData && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar recorrência..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="amount">Valor</option>
            <option value="name">Nome</option>
            <option value="confidence">Confiança</option>
            <option value="occurrences">Ocorrências</option>
          </select>
        </div>
      )}

      {/* Balance overview + CSV export */}
      {hasAnyData && monthlyIncome > 0 && monthlyTotal > 0 && (
        <div className="rounded-lg border bg-card px-4 py-2.5 text-sm">
          <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{fmt(monthlyIncome)}</span>
            <span className="text-muted-foreground">−</span>
            <span className="text-red-500 font-medium">{fmt(monthlyTotal)}</span>
            <span className="text-muted-foreground">=</span>
            <span className={cn('font-semibold', balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
              {balance >= 0 ? '+' : ''}{fmt(balance)}
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </button>
          </div>
          {monthlyTotal > 0 && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Compromissos representam {Math.round((monthlyTotal / monthlyIncome) * 100)}% da receita recorrente
            </p>
          )}
        </div>
      )}

      {fetchError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Não foi possível carregar suas recorrências.
        </div>
      )}

      {/* Search empty state */}
      {hasAnyData && searchQuery.trim() && (
        (tab === 'income' && income.length === 0) ||
        (tab === 'expenses' && subscriptions.length === 0 && installments.length === 0)
      ) && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card py-10 text-center">
          <Search className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum resultado para &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}

      {tab === 'income' ? (
        !hasIncomeData ? (
          <div className="space-y-4">
            {isDetecting ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analisando suas transações...</p>
              </div>
            ) : (
              <>
                <EmptyState
                  icon={TrendingUp}
                  title="Nenhuma receita recorrente detectada"
                  description="Nenhuma receita recorrente foi encontrada nas suas transações."
                />
                <div className="flex justify-center">
                  <Button onClick={handleDetect} disabled={isDetecting}>
                    Detectar novamente
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Income summary card */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita recorrente</p>
                    <p className="text-xl font-bold">
                      {fmt(monthlyIncome)}
                      <span className="text-base font-normal text-muted-foreground">/mês</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMonthOffset((o) => o - 1)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="min-w-[10rem] text-center text-sm font-medium">{monthLabel}</span>
                  <button
                    onClick={() => setMonthOffset((o) => o + 1)}
                    disabled={monthOffset >= 0}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6 border-t pt-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Fontes ativas:</span>
                  <span className="font-medium">{income.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Anual estimado:</span>
                  <span className="font-medium">{fmt(monthlyIncome * 12)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDetect}
                  disabled={isDetecting}
                  className="ml-auto"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isDetecting && 'animate-spin')} />
                  {isDetecting ? 'Detectando...' : 'Atualizar'}
                </Button>
              </div>
            </div>

            {/* Income items */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Receitas Recorrentes
                </h2>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(monthlyIncome)}/mês</p>
                  <p className="text-xs text-muted-foreground">
                    {income.length} fonte{income.length !== 1 ? 's' : ''} ativa{income.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {income.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{cleanMerchantName(item.merchant)}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.frequency === 'monthly' ? 'Mensal' : item.frequency === 'yearly' ? 'Anual' : item.frequency}
                          {item.occurrences > 0 && ` · ${item.occurrences} ${item.occurrences === 1 ? 'mês' : 'meses'}`}
                          {item.next_expected_date && (() => {
                            const d = new Date(item.next_expected_date + 'T12:00:00');
                            const day = d.getDate();
                            const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                            return ` · Próxima: ${day} ${monthNames[d.getMonth()]}`;
                          })()}
                          {item.confidence !== 'high' && (
                            <span className={cn(
                              'ml-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-medium',
                              item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                            )}>
                              {item.confidence === 'medium' ? 'provável' : 'possível'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleType(item)}
                        disabled={togglingId === item.id}
                        aria-label={`Reclassificar ${cleanMerchantName(item.merchant)} como ${nextTypeLabel(item.type)}`}
                        title={`Reclassificar como ${nextTypeLabel(item.type)}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDismiss(item)}
                        aria-label={`Descartar ${cleanMerchantName(item.merchant)}`}
                        title="Descartar"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <AmountDisplay item={item} hideValues={hideValues} editingId={editingId} editAmount={editAmount} setEditingId={setEditingId} setEditAmount={setEditAmount} onSave={handleEditAmount} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )
      ) : !hasExpenseData ? (
        <div className="space-y-4">
          {isDetecting ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando suas transações...</p>
            </div>
          ) : (
            <>
              <EmptyState
                icon={Repeat}
                title="Nenhuma recorrência detectada"
                description="Nenhuma assinatura ou parcela recorrente foi encontrada nas suas transações."
              />
              <div className="flex justify-center">
                <Button onClick={handleDetect} disabled={isDetecting}>
                  Detectar novamente
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <RingChart paidPercent={paidPercent} />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">
                    {fmt(monthlyTotal)}
                    <span className="text-base font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMonthOffset((o) => o - 1)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-[10rem] text-center text-sm font-medium">{monthLabel}</span>
                <button
                  onClick={() => setMonthOffset((o) => o + 1)}
                  disabled={monthOffset >= 0}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-6 border-t pt-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-muted-foreground">Parcelas:</span>
                <span className="font-medium">{fmt(installmentsTotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Recorrentes:</span>
                <span className="font-medium">{fmt(subscriptionsTotal)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDetect}
                disabled={isDetecting}
                className="ml-auto"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isDetecting && 'animate-spin')} />
                {isDetecting ? 'Detectando...' : 'Atualizar'}
              </Button>
            </div>
          </div>

          {/* Installments section */}
          {installments.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  Parcelas
                </h2>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(installmentsRemainingTotal)} Restante</p>
                  <p className="text-xs text-muted-foreground">
                    {installments.length} parcela{installments.length !== 1 ? 's' : ''} ativa{installments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {installments.map((inst) => {
                  const endLabel = formatEndDate(inst.next_expected_date, inst.installments_remaining);
                  return (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{cleanMerchantName(inst.merchant)}</p>
                          <p className="text-xs text-muted-foreground">
                            {inst.installments_remaining != null
                              ? `${inst.installments_remaining} parcelas restantes`
                              : 'Em andamento'}
                            {endLabel && ` · ${endLabel}`}
                            {inst.confidence !== 'high' && (
                              <span className={cn(
                                'ml-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-medium',
                                inst.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                              )}>
                                {inst.confidence === 'medium' ? 'provável' : 'possível'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {inst.installments_remaining != null && (
                          <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            {inst.installments_remaining}x
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleType(inst)}
                          disabled={togglingId === inst.id}
                          aria-label={`Reclassificar ${cleanMerchantName(inst.merchant)} como ${nextTypeLabel(inst.type)}`}
                          title={`Reclassificar como ${nextTypeLabel(inst.type)}`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDismiss(inst)}
                          aria-label={`Descartar ${cleanMerchantName(inst.merchant)}`}
                          title="Descartar"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <AmountDisplay item={inst} hideValues={hideValues} editingId={editingId} editAmount={editAmount} setEditingId={setEditingId} setEditAmount={setEditAmount} onSave={handleEditAmount} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Subscriptions section */}
          {subscriptions.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Repeat className="h-5 w-5 text-muted-foreground" />
                  Assinaturas
                </h2>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmt(subscriptionsTotal)}/mês</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(subscriptionsTotal * 12)}/ano
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                        <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{cleanMerchantName(sub.merchant)}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.frequency === 'monthly' ? 'Mensal' : sub.frequency === 'yearly' ? 'Anual' : sub.frequency}
                          {sub.occurrences > 0 && ` · ${sub.occurrences}x`}
                          {sub.next_expected_date && (() => {
                            const next = new Date(sub.next_expected_date + 'T00:00:00');
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays >= 0 && diffDays <= 7) return ` · em ${diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanhã' : `${diffDays} dias`}`;
                            return null;
                          })()}
                          {sub.confidence !== 'high' && (
                            <span className={cn(
                              'ml-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-medium',
                              sub.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                            )}>
                              {sub.confidence === 'medium' ? 'provável' : 'possível'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleType(sub)}
                        disabled={togglingId === sub.id}
                        aria-label={`Reclassificar ${cleanMerchantName(sub.merchant)} como ${nextTypeLabel(sub.type)}`}
                        title={`Reclassificar como ${nextTypeLabel(sub.type)}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/chat?q=${encodeURIComponent(`Vale a pena manter a assinatura ${cleanMerchantName(sub.merchant)} de ${fmt(sub.amount)}/mês?`)}`)}
                        aria-label={`Perguntar sobre ${cleanMerchantName(sub.merchant)}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        title="Perguntar para a Cleo"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDismiss(sub)}
                        aria-label={`Descartar ${cleanMerchantName(sub.merchant)}`}
                        title="Descartar"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <AmountDisplay item={sub} hideValues={hideValues} editingId={editingId} editAmount={editAmount} setEditingId={setEditingId} setEditAmount={setEditAmount} onSave={handleEditAmount} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </>
      )}

      {/* Add modal */}
      {showAddForm && (
        <div
          className={cn('fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200', modalVisible ? 'bg-black/50' : 'bg-black/0')}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}
        >
          <div className={cn('w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4 transition-all duration-200', modalVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0')}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Nova recorrência</h3>
              <button onClick={() => setShowAddForm(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Netflix, Aluguel..."
                  value={addForm.merchant}
                  onChange={(e) => setAddForm(f => ({ ...f, merchant: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Valor (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={addForm.amount}
                    onChange={(e) => setAddForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm(f => ({ ...f, type: e.target.value as 'subscription' | 'installment' | 'income' }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="subscription">Assinatura</option>
                    <option value="installment">Parcela</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={handleAdd}
                disabled={isAdding || !addForm.merchant.trim() || !addForm.amount}
              >
                {isAdding ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

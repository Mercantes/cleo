'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Grid3X3, Loader2, Pencil, TrendingDown, TrendingUp, AlertTriangle, Sparkles, Trash2, Check, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useApi } from '@/hooks/use-api';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

interface CategorySpending {
  name: string;
  amount: number;
  categoryId: string | null;
  percentage: number;
  color: string;
  change?: number | null;
}

interface CategoriesListData {
  categories: CategoryItem[];
}

interface CategoriesSpendingData {
  categories: CategorySpending[];
}

interface CategoryRule {
  id: string;
  merchant_pattern: string;
  match_type: string;
  created_at: string;
  category_id: string;
  categories: { id: string; name: string; icon: string } | null;
}

interface CategoryRulesData {
  rules: CategoryRule[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: 'bg-orange-500',
  Transporte: 'bg-red-500',
  Moradia: 'bg-amber-500',
  Saúde: 'bg-pink-500',
  Educação: 'bg-blue-500',
  Lazer: 'bg-purple-500',
  Serviços: 'bg-green-500',
  Transferências: 'bg-red-600',
  Supermercado: 'bg-lime-500',
  Restaurantes: 'bg-yellow-500',
  Seguros: 'bg-orange-400',
  Hospedagem: 'bg-amber-600',
  Telecomunicações: 'bg-cyan-500',
  'Serviços digitais': 'bg-violet-500',
  'Hospital/Labs': 'bg-rose-500',
  Investimentos: 'bg-emerald-500',
  Estacionamento: 'bg-violet-400',
};

function getMonthOptions() {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
  }
  return options;
}

export function CategoriesPageContent() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(currentMonth);
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const { data: listData, isLoading: listLoading } = useApi<CategoriesListData>('/api/categories');
  const { data: spendingData, isLoading: spendingLoading } = useApi<CategoriesSpendingData>(
    `/api/dashboard/categories?month=${month}`,
  );

  const { data: rulesData, isLoading: rulesLoading, mutate: mutateRules } = useApi<CategoryRulesData>(
    '/api/settings/category-rules',
  );
  const rules = useMemo(() => rulesData?.rules || [], [rulesData]);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<{ id: string; categoryId: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const handleEditRule = useCallback(async () => {
    if (!editingRule || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/settings/category-rules/${editingRule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: editingRule.categoryId }),
      });
      if (res.ok) {
        mutateRules();
        setEditingRule(null);
      }
    } catch {
      // silently fail
    } finally {
      setEditSaving(false);
    }
  }, [editingRule, editSaving, mutateRules]);

  const handleDeleteRule = useCallback(async (ruleId: string) => {
    setDeletingRuleId(ruleId);
    try {
      const res = await fetch(`/api/settings/category-rules/${ruleId}`, { method: 'DELETE' });
      if (res.ok) {
        mutateRules();
      }
    } catch {
      // silently fail
    } finally {
      setDeletingRuleId(null);
    }
  }, [mutateRules]);

  const isLoading = listLoading || spendingLoading || rulesLoading;
  const allCategories = useMemo(() => listData?.categories || [], [listData]);
  const spending = useMemo(() => spendingData?.categories || [], [spendingData]);
  const totalSpending = spending.reduce((sum, c) => sum + c.amount, 0);

  const mergedCategories = useMemo(() => {
    const spendingMap = new Map(spending.map((s) => [s.name, s]));

    const withSpending = allCategories.map((cat) => {
      const s = spendingMap.get(cat.name);
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        amount: s?.amount || 0,
        percentage: s?.percentage || 0,
        change: s?.change ?? null,
      };
    });

    return withSpending.sort((a, b) => b.amount - a.amount);
  }, [allCategories, spending]);

  const maxAmount = Math.max(...mergedCategories.map((c) => c.amount), 1);
  const activeCategories = mergedCategories.filter((c) => c.amount > 0);
  const inactiveCount = mergedCategories.length - activeCategories.length;
  const risingCategories = mergedCategories.filter((c) => c.change != null && c.change > 20);
  const topCategory = activeCategories.length > 0 ? activeCategories[0] : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Categorias</h1>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (allCategories.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <EmptyState
          icon={Grid3X3}
          title="Nenhuma categoria encontrada"
          description="Suas categorias aparecerão aqui após importar transações do banco."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            {allCategories.length} categorias · {formatCurrency(totalSpending)} em gastos
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Insight cards */}
      {totalSpending > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total gasto</p>
            <p className="text-lg font-bold">{formatCurrency(totalSpending)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Categorias ativas</p>
            <p className="text-lg font-bold">{activeCategories.length}</p>
            {inactiveCount > 0 && (
              <p className="text-xs text-muted-foreground">{inactiveCount} sem gastos</p>
            )}
          </div>
          {topCategory && (
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">Maior categoria</p>
              <p className="truncate text-lg font-bold">{topCategory.name}</p>
              <p className="text-xs text-muted-foreground">{topCategory.percentage}% do total</p>
            </div>
          )}
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Média por categoria</p>
            <p className="text-lg font-bold">
              {formatCurrency(activeCategories.length > 0 ? totalSpending / activeCategories.length : 0)}
            </p>
          </div>
        </div>
      )}

      {/* Alert for categories rising fast */}
      {risingCategories.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {risingCategories.length === 1
              ? `${risingCategories[0].name} subiu ${risingCategories[0].change}% vs mês anterior`
              : `${risingCategories.length} categorias subiram mais de 20% vs mês anterior: ${risingCategories.map(c => c.name).join(', ')}`
            }
          </p>
        </div>
      )}

      {/* Summary bar */}
      {totalSpending > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex h-3">
            {spending
              .filter((c) => c.percentage > 0)
              .map((cat) => {
                const bgClass = CATEGORY_COLORS[cat.name] || '';
                return (
                  <div
                    key={cat.name}
                    className={cn('transition-all', bgClass || 'bg-primary')}
                    style={{
                      width: `${cat.percentage}%`,
                      ...(!bgClass ? { backgroundColor: cat.color } : {}),
                    }}
                    title={`${cat.name}: ${cat.percentage}%`}
                  />
                );
              })}
          </div>
          <div className="flex flex-wrap gap-3 px-4 py-3">
            {spending
              .filter((c) => c.percentage > 0)
              .map((cat) => {
                const bgClass = CATEGORY_COLORS[cat.name] || '';
                return (
                  <span key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn('inline-block h-2.5 w-2.5 rounded-full', bgClass)}
                      style={!bgClass ? { backgroundColor: cat.color } : undefined}
                    />
                    {cat.name} ({cat.percentage}%)
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* User rules section */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold">Minhas Regras</h2>
            {rules.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {rules.length}
              </span>
            )}
          </div>
        </div>

        {rules.length === 0 ? (
          <p className="px-4 py-4 text-center text-xs text-muted-foreground">
            Ao recategorizar uma transação, você pode criar uma regra automática.
          </p>
        ) : (
          <div className="divide-y">
            {rules.map((rule) => {
              const isEditing = editingRule?.id === rule.id;
              return (
                <div key={rule.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg">{rule.categories?.icon || '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{rule.merchant_pattern}</p>
                    {isEditing ? (
                      <select
                        value={editingRule.categoryId}
                        onChange={(e) => setEditingRule({ ...editingRule, categoryId: e.target.value })}
                        className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        {allCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {rule.categories?.name || 'Categoria removida'} · {rule.match_type === 'exact' ? 'Exato' : 'Contém'}
                      </p>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleEditRule}
                        disabled={editSaving}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                        aria-label="Salvar"
                      >
                        {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditingRule(null)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                        aria-label="Cancelar"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRule({ id: rule.id, categoryId: rule.category_id })}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Editar regra"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deletingRuleId === rule.id}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        aria-label="Remover regra"
                      >
                        {deletingRuleId === rule.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Categories list */}
      <div className="rounded-lg border bg-card">
        {/* Table header */}
        <div className="hidden items-center gap-3 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
          <span className="w-10" />
          <span className="flex-1">Categoria</span>
          <span className="w-28 text-right">Gasto no mês</span>
          <span className="hidden flex-1 lg:block" />
          <span className="w-20 text-right">Variação</span>
          <span className="w-16 text-right">%</span>
        </div>

        <div className="divide-y">
          {mergedCategories.map((cat) => {
            const barWidth = cat.amount > 0 ? (cat.amount / maxAmount) * 100 : 0;
            const barColorClass = CATEGORY_COLORS[cat.name] || '';

            return (
              <Link
                key={cat.id}
                href={`/transactions?category=${encodeURIComponent(cat.id)}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:py-3.5"
              >
                {/* Icon */}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                  {cat.icon}
                </span>

                {/* Name */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', barColorClass)}
                      style={!barColorClass ? { backgroundColor: '#6B7280' } : undefined}
                    />
                    <span className="truncate text-sm font-medium">{cat.name}</span>
                  </span>
                  {/* Mobile: amount below name */}
                  <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                    {cat.amount > 0 ? formatCurrency(cat.amount) : 'Sem gastos'}
                  </span>
                </span>

                {/* Amount */}
                <span className="hidden w-28 shrink-0 text-right text-sm font-medium sm:block">
                  {cat.amount > 0 ? formatCurrency(cat.amount) : '—'}
                </span>

                {/* Progress bar */}
                <span className="hidden flex-1 lg:block">
                  {cat.amount > 0 && (
                    <span className="relative block h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <span
                        className={cn('block h-full rounded-full transition-all', barColorClass || 'bg-primary')}
                        style={{ width: `${barWidth}%` }}
                      />
                    </span>
                  )}
                </span>

                {/* Change % */}
                <span className="hidden w-20 shrink-0 text-right sm:block">
                  {cat.change != null && cat.change !== 0 ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-medium',
                        cat.change > 0 ? 'text-red-500' : 'text-green-500',
                      )}
                    >
                      {cat.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {cat.change > 0 ? '+' : ''}
                      {cat.change}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </span>

                {/* Percentage of total */}
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                  {cat.percentage > 0 ? `${cat.percentage}%` : '—'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

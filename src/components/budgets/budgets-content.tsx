'use client';

import { useState } from 'react';
import {
  PieChart,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  monthlyLimit: number;
  spent: number;
  percentage: number;
  status: 'over' | 'warning' | 'ok';
}

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
}

export function BudgetsContent() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => (hideValues ? HIDDEN_VALUE : formatCurrency(v));
  const { data, isLoading, mutate } = useApi<{ budgets: BudgetItem[] }>('/api/budgets');
  const { data: catData } = useApi<{ categories: CategoryOption[] }>('/api/categories');

  const [showForm, setShowForm] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const budgets = data?.budgets || [];
  const categories = catData?.categories || [];

  // Filter out categories that already have budgets
  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c.id));

  const overBudget = budgets.filter((b) => b.status === 'over');
  const warningBudget = budgets.filter((b) => b.status === 'warning');
  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  function openForm() {
    setShowForm(true);
    requestAnimationFrame(() => setFormVisible(true));
  }

  function closeForm() {
    setFormVisible(false);
    setTimeout(() => {
      setShowForm(false);
      setSelectedCategory('');
      setLimitAmount('');
    }, 200);
  }

  async function handleSave() {
    if (!selectedCategory || !limitAmount) return;
    setSaving(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory,
          monthlyLimit: parseFloat(limitAmount),
        }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      closeForm();
      toast.success('Orçamento criado');
    } catch {
      toast.error('Erro ao criar orçamento');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(budget: BudgetItem) {
    if (data) {
      mutate({ budgets: budgets.filter((b) => b.id !== budget.id) }, false);
    }
    try {
      const res = await fetch(`/api/budgets?id=${budget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Orçamento removido');
    } catch {
      await mutate();
      toast.error('Erro ao remover orçamento');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  if (budgets.length === 0 && !showForm) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={PieChart}
          title="Nenhum orçamento definido"
          description="Crie limites de gastos por categoria para controlar suas despesas."
        />
        <div className="flex justify-center">
          <Button onClick={openForm}>
            <Plus className="mr-2 h-4 w-4" />
            Criar orçamento
          </Button>
        </div>
        {showForm && renderForm()}
      </div>
    );
  }

  function renderForm() {
    return showForm ? (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200',
          formVisible ? 'bg-black/50' : 'bg-black/0',
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeForm();
        }}
      >
        <div
          className={cn(
            'w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4 transition-all duration-200',
            formVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Novo orçamento</h3>
            <button onClick={closeForm} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecione...</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Limite mensal (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={closeForm}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={handleSave}
              disabled={saving || !selectedCategory || !limitAmount}
            >
              {saving ? 'Salvando...' : 'Criar'}
            </Button>
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Categorias</p>
          <p className="text-xl font-bold">{budgets.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Limite total</p>
          <p className="text-xl font-bold">{fmt(totalLimit)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Gasto total</p>
          <p className={cn('text-xl font-bold', totalSpent > totalLimit && 'text-red-500')}>{fmt(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Disponível</p>
          <p className={cn('text-xl font-bold', totalLimit - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {fmt(totalLimit - totalSpent)}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {overBudget.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {overBudget.length} categoria{overBudget.length > 1 ? 's' : ''} acima do limite:{' '}
            {overBudget.map((b) => b.categoryName).join(', ')}
          </span>
        </div>
      )}
      {warningBudget.length > 0 && overBudget.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {warningBudget.length} categoria{warningBudget.length > 1 ? 's' : ''} perto do limite
          </span>
        </div>
      )}

      {/* Budget list */}
      <div className="space-y-3">
        {budgets.map((budget) => (
          <div key={budget.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                  {budget.categoryIcon}
                </span>
                <div>
                  <p className="text-sm font-medium">{budget.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(budget.spent)} de {fmt(budget.monthlyLimit)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {budget.status === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {budget.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {budget.status === 'over' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                <span className={cn(
                  'text-sm font-semibold',
                  budget.status === 'ok' && 'text-emerald-600',
                  budget.status === 'warning' && 'text-amber-600',
                  budget.status === 'over' && 'text-red-500',
                )}>
                  {budget.percentage}%
                </span>
                <button
                  onClick={() => handleDelete(budget)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                  title="Remover orçamento"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  budget.status === 'ok' && 'bg-emerald-500',
                  budget.status === 'warning' && 'bg-amber-500',
                  budget.status === 'over' && 'bg-red-500',
                )}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              />
            </div>
            {budget.status === 'over' && (
              <p className="mt-1.5 text-xs text-red-500">
                {fmt(budget.spent - budget.monthlyLimit)} acima do limite
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add button */}
      {availableCategories.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={openForm}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar orçamento
          </Button>
        </div>
      )}

      {renderForm()}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Save, Loader2, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';
import { toast } from '@/components/ui/toast';
import { useFormSubmit } from '@/hooks/use-form-submit';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  monthlyLimit: number;
  spent: number;
  percentage: number;
  status: string;
}

function CategoryBudgetsEditor() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [limitValue, setLimitValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchWithTimeout('/api/budgets').then((r) => r.ok ? r.json() : null),
      fetchWithTimeout('/api/categories').then((r) => r.ok ? r.json() : null),
    ]).then(([budgetsData, catsData]) => {
      if (budgetsData?.budgets) setBudgets(budgetsData.budgets);
      if (catsData?.categories) setCategories(catsData.categories);
    }).catch(() => {});
  }, []);

  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id),
  );

  async function handleAdd() {
    if (!selectedCat || !limitValue || Number(limitValue) <= 0) return;
    setSaving(true);
    try {
      const res = await fetchWithTimeout('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCat, monthlyLimit: Number(limitValue) }),
      });
      if (res.ok) {
        const refreshRes = await fetchWithTimeout('/api/budgets');
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setBudgets(data.budgets || []);
        }
        setSelectedCat('');
        setLimitValue('');
        toast.success('Limite adicionado');
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleDelete(budgetId: string) {
    const res = await fetchWithTimeout(`/api/budgets?id=${budgetId}`, { method: 'DELETE' });
    if (res.ok) {
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
      toast.success('Limite removido');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Limites por categoria</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Defina quanto quer gastar no máximo em cada categoria por mês
        </p>
      </div>

      {budgets.length > 0 && (
        <div className="space-y-2">
          {budgets.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{b.categoryIcon}</span>
                <span className="text-sm font-medium">{b.categoryName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  R$ {b.monthlyLimit.toFixed(0)}/mês
                </span>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                  aria-label={`Remover limite de ${b.categoryName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableCategories.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Selecionar categoria"
            >
              <option value="">Selecionar categoria...</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <input
              type="number"
              min="1"
              step="50"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              placeholder="R$ limite"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              aria-label="Valor do limite mensal"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !selectedCat || !limitValue}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

export function GoalsEditor() {
  const [savingsTarget, setSavingsTarget] = useState('');
  const [retirementAge, setRetirementAge] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { submit, saving, feedback } = useFormSubmit({
    successMessage: 'Metas salvas com sucesso',
  });

  useEffect(() => {
    fetchWithTimeout('/api/goals')
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.goals) {
          setSavingsTarget(data.goals.monthly_savings_target?.toString() || '');
          setRetirementAge(data.goals.retirement_age_target?.toString() || '');
        }
        if (data?.progress) {
          setCurrentProgress(data.progress.percentage);
          setCurrentSavings(data.progress.currentSavings);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () =>
    submit(() =>
      fetchWithTimeout('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlySavingsTarget: savingsTarget ? Number(savingsTarget) : null,
          retirementAgeTarget: retirementAge ? Number(retirementAge) : null,
        }),
      }),
    );

  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950">
        <p className="text-sm text-red-700 dark:text-red-300">Não foi possível carregar suas metas.</p>
      </div>
    );
  }

  const target = savingsTarget ? Number(savingsTarget) : 0;

  return (
    <div className="space-y-6">
      {/* Current progress */}
      {target > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-primary" />
            Progresso do mês atual
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xl font-bold">{formatCurrency(currentSavings)}</p>
              <p className="text-xs text-muted-foreground">de {formatCurrency(target)}</p>
            </div>
            <p className={`text-lg font-bold ${currentProgress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
              {currentProgress}%
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-700 ${currentProgress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, currentProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Edit goals */}
      <div className="space-y-4">
        <div>
          <label htmlFor="savings-target" className="block text-sm font-medium">
            Meta mensal de economia (R$)
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Quanto você quer economizar por mês
          </p>
          <input
            id="savings-target"
            type="number"
            min="0"
            max="10000000"
            step="50"
            value={savingsTarget}
            onChange={(e) => setSavingsTarget(e.target.value)}
            placeholder="Ex: 500"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="retirement-age" className="block text-sm font-medium">
            Idade alvo para aposentadoria
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Opcional - usada para projeções de longo prazo
          </p>
          <input
            id="retirement-age"
            type="number"
            min="18"
            max="120"
            value={retirementAge}
            onChange={(e) => setRetirementAge(e.target.value)}
            placeholder="Ex: 60"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {feedback === 'saved' ? 'Salvo!' : 'Salvar metas'}
        </button>
        {feedback === 'error' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Erro ao salvar. Tente novamente.
          </p>
        )}
      </div>

      <CategoryBudgetsEditor />

      <Link
        href="/projections"
        className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <TrendingUp className="h-4 w-4" />
        Ver projeções baseadas nas suas metas
      </Link>
    </div>
  );
}

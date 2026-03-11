'use client';

import { useEffect, useState } from 'react';
import { Target, Save, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

export function GoalsEditor() {
  const [savingsTarget, setSavingsTarget] = useState('');
  const [retirementAge, setRetirementAge] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const res = await fetchWithTimeout('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlySavingsTarget: savingsTarget ? Number(savingsTarget) : null,
          retirementAgeTarget: retirementAge ? Number(retirementAge) : null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

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
          {saved ? 'Salvo!' : 'Salvar metas'}
        </button>
        {saveError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Erro ao salvar. Tente novamente.
          </p>
        )}
      </div>
    </div>
  );
}

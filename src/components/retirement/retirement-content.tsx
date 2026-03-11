'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RetirementForm } from './retirement-form';
import { GapAnalysis } from './gap-analysis';

const RetirementChart = dynamic(() => import('./retirement-chart').then((m) => m.RetirementChart), {
  ssr: false,
  loading: () => <div className="h-[350px] animate-pulse rounded-lg border bg-muted" />,
});
import type { RetirementResult } from '@/lib/finance/retirement-engine';

export function RetirementContent() {
  const [formValues, setFormValues] = useState({
    targetMonthlyIncome: 5000,
    annualReturnRate: 0.08,
    currentPortfolio: 0,
  });
  const [data, setData] = useState<RetirementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/retirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [formValues]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full lg:w-72">
        <RetirementForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={calculate}
          loading={loading}
        />
      </div>
      <div className="flex-1 space-y-6">
        {loading && !data ? (
          <div className="space-y-4">
            <div className="h-[280px] animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Erro ao calcular. Ajuste os parâmetros e tente novamente.
            </p>
          </div>
        ) : data ? (
          <>
            <RetirementChart timeline={data.portfolioTimeline} fiNumber={data.fiNumber} />
            <GapAnalysis data={data} />
          </>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { RetirementForm } from './retirement-form';
import { RetirementChart } from './retirement-chart';
import { GapAnalysis } from './gap-analysis';
import type { RetirementResult } from '@/lib/finance/retirement-engine';

export function RetirementContent() {
  const [formValues, setFormValues] = useState({
    targetMonthlyIncome: 5000,
    annualReturnRate: 0.08,
    currentPortfolio: 0,
  });
  const [data, setData] = useState<RetirementResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/retirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [formValues]);

  useEffect(() => {
    calculate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

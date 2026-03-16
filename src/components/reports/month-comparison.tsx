'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';

interface ComparisonData {
  comparison: {
    month1: MonthData;
    month2: MonthData;
    categoryComparison: Array<{
      name: string;
      icon: string;
      amount1: number;
      amount2: number;
      diff: number;
      changePercent: number;
    }>;
    highlights: {
      incomeChange: number;
      expenseChange: number;
      balanceChange: number;
    };
  };
}

interface MonthData {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
}

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function MonthComparison() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const [month1, setMonth1] = useState(currentMonth);
  const [year1, setYear1] = useState(currentYear);
  const [month2, setMonth2] = useState(currentMonth === 1 ? 12 : currentMonth - 1);
  const [year2, setYear2] = useState(currentMonth === 1 ? currentYear - 1 : currentYear);

  const { data, isLoading } = useApi<ComparisonData>(
    `/api/reports/compare?month1=${month1}&year1=${year1}&month2=${month2}&year2=${year2}`
  );

  const comp = data?.comparison;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month selectors */}
      <div className="grid grid-cols-2 gap-4">
        <MonthSelector
          label="Mês 1"
          month={month1}
          year={year1}
          onChangeMonth={setMonth1}
          onChangeYear={setYear1}
        />
        <MonthSelector
          label="Mês 2"
          month={month2}
          year={year2}
          onChangeMonth={setMonth2}
          onChangeYear={setYear2}
        />
      </div>

      {comp && (
        <>
          {/* Summary comparison */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-3 border-b">
              <div className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{comp.month1.label}</p>
              </div>
              <div className="border-x p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">Métrica</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{comp.month2.label}</p>
              </div>
            </div>

            <ComparisonRow
              label="Receita"
              value1={comp.month1.income}
              value2={comp.month2.income}
              change={comp.highlights.incomeChange}
              positiveIsGood
            />
            <ComparisonRow
              label="Despesas"
              value1={comp.month1.expenses}
              value2={comp.month2.expenses}
              change={comp.highlights.expenseChange}
              positiveIsGood={false}
            />
            <ComparisonRow
              label="Saldo"
              value1={comp.month1.balance}
              value2={comp.month2.balance}
              change={0}
              positiveIsGood
            />
            <div className="grid grid-cols-3 border-t">
              <div className="p-3 text-center">
                <p className={`text-lg font-bold ${comp.month1.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comp.month1.savingsRate}%
                </p>
              </div>
              <div className="flex items-center justify-center border-x p-3">
                <p className="text-xs text-muted-foreground">Economia</p>
              </div>
              <div className="p-3 text-center">
                <p className={`text-lg font-bold ${comp.month2.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comp.month2.savingsRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Category comparison */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-medium">Comparação por categoria</h3>
            <div className="space-y-3">
              {comp.categoryComparison.map(cat => (
                <div key={cat.name} className="rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{cat.icon} {cat.name}</span>
                    <ChangeIndicator change={cat.changePercent} positiveIsGood={false} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{fmt(cat.amount1)}</span>
                    <span className={`font-medium ${cat.diff > 0 ? 'text-red-500' : cat.diff < 0 ? 'text-green-500' : ''}`}>
                      {cat.diff > 0 ? '+' : ''}{cat.diff !== 0 ? fmt(cat.diff) : '='}
                    </span>
                    <span>{fmt(cat.amount2)}</span>
                  </div>
                  {/* Visual bar comparison */}
                  <div className="mt-1 flex gap-1">
                    <div className="h-1.5 flex-1 rounded-full bg-primary/60" style={{
                      width: `${Math.max(cat.amount1, cat.amount2) > 0 ? (cat.amount1 / Math.max(cat.amount1, cat.amount2)) * 100 : 0}%`
                    }} />
                    <div className="h-1.5 flex-1 rounded-full bg-primary/30" style={{
                      width: `${Math.max(cat.amount1, cat.amount2) > 0 ? (cat.amount2 / Math.max(cat.amount1, cat.amount2)) * 100 : 0}%`
                    }} />
                  </div>
                </div>
              ))}
              {comp.categoryComparison.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados para comparar</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MonthSelector({
  label,
  month,
  year,
  onChangeMonth,
  onChangeYear,
}: {
  label: string;
  month: number;
  year: number;
  onChangeMonth: (m: number) => void;
  onChangeYear: (y: number) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <select
          value={month}
          onChange={e => onChangeMonth(parseInt(e.target.value))}
          className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => onChangeYear(parseInt(e.target.value))}
          className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  value1,
  value2,
  change,
  positiveIsGood,
}: {
  label: string;
  value1: number;
  value2: number;
  change: number;
  positiveIsGood: boolean;
}) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  return (
    <div className="grid grid-cols-3 border-b">
      <div className="p-3 text-center">
        <p className="text-sm font-medium">{fmt(Math.abs(value1))}</p>
      </div>
      <div className="flex items-center justify-center gap-1 border-x p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        {change !== 0 && <ChangeIndicator change={change} positiveIsGood={positiveIsGood} />}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm font-medium">{fmt(Math.abs(value2))}</p>
      </div>
    </div>
  );
}

function ChangeIndicator({ change, positiveIsGood }: { change: number; positiveIsGood: boolean }) {
  if (change === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;

  const isGood = positiveIsGood ? change > 0 : change < 0;
  return (
    <span className={`flex items-center text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
      {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(change)}%
    </span>
  );
}

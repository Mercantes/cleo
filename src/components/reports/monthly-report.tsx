'use client';

import { useState } from 'react';
import { Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';

interface ReportData {
  report: {
    period: { year: number; month: number; label: string };
    summary: {
      income: number;
      expenses: number;
      balance: number;
      savingsRate: number;
      transactionCount: number;
    };
    comparison: {
      prevIncome: number;
      prevExpenses: number;
      incomeChange: number;
      expenseChange: number;
    };
    categories: Array<{
      name: string;
      icon: string;
      total: number;
      count: number;
      percentage: number;
    }>;
    dailySpending: Array<{ date: string; amount: number }>;
    topExpenses: Array<{ amount: number; date: string; category: string }>;
  };
}

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function MonthlyReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const { data, isLoading } = useApi<ReportData>(
    `/api/reports/monthly?year=${year}&month=${month}`
  );

  const report = data?.report;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const rows = [
      ['Relatório Mensal', `${monthNames[month - 1]} ${year}`],
      [],
      ['Resumo'],
      ['Receita', String(report.summary.income)],
      ['Despesas', String(report.summary.expenses)],
      ['Saldo', String(report.summary.balance)],
      ['Taxa de economia', `${report.summary.savingsRate}%`],
      ['Transações', String(report.summary.transactionCount)],
      [],
      ['Categoria', 'Ícone', 'Total', 'Transações', '%'],
      ...report.categories.map(c => [c.name, c.icon, String(c.total), String(c.count), `${c.percentage}%`]),
      [],
      ['Data', 'Gasto diário'],
      ...report.dailySpending.map(d => [d.date, String(d.amount)]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${monthNames[month - 1].toLowerCase()}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!report) return null;

  const maxDailySpending = Math.max(...report.dailySpending.map(d => d.amount), 1);

  return (
    <div className="space-y-6 print:space-y-4" id="monthly-report">
      {/* Month selector */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            &larr;
          </button>
          <h2 className="text-lg font-bold">{monthNames[month - 1]} {year}</h2>
          <button onClick={() => changeMonth(1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            &rarr;
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Receita"
          value={report.summary.income}
          change={report.comparison.incomeChange}
          positive
        />
        <SummaryCard
          label="Despesas"
          value={report.summary.expenses}
          change={report.comparison.expenseChange}
          positive={false}
        />
        <SummaryCard
          label="Saldo"
          value={report.summary.balance}
        />
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Taxa de economia</p>
          <p className={`text-xl font-bold ${report.summary.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {report.summary.savingsRate}%
          </p>
          <p className="text-xs text-muted-foreground">
            {report.summary.transactionCount} transações
            {report.summary.transactionCount > 0 && ` · ${fmt(report.summary.expenses / report.summary.transactionCount)} média`}
          </p>
        </div>
      </div>

      {/* Daily average + insight */}
      {report.summary.expenses > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Média diária</p>
            {(() => {
              const avg = report.dailySpending.length > 0 ? report.summary.expenses / report.dailySpending.length : 0;
              const aboveAvg = report.dailySpending.filter(d => d.amount > avg).length;
              return (
                <>
                  <p className="text-xl font-bold">{fmt(avg)}</p>
                  <p className="text-xs text-muted-foreground">
                    {aboveAvg} dia{aboveAvg !== 1 ? 's' : ''} acima da média
                  </p>
                </>
              );
            })()}
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Dia mais caro</p>
            <p className="text-xl font-bold">{fmt(maxDailySpending)}</p>
            <p className="text-xs text-muted-foreground">
              {report.dailySpending.length > 0
                ? new Date(report.dailySpending.reduce((a, b) => a.amount > b.amount ? a : b).date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                : '—'}
            </p>
          </div>
          {report.categories.length > 0 && (
            <div className="col-span-2 rounded-lg border bg-card p-3 md:col-span-1">
              <p className="text-xs text-muted-foreground">Maior categoria</p>
              <p className="text-xl font-bold">{report.categories[0].icon} {report.categories[0].name}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(report.categories[0].total)} ({report.categories[0].percentage}% do total)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category breakdown */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-medium">Gastos por categoria</h3>
        <div className="space-y-3">
          {report.categories.map(cat => (
            <div key={cat.name}>
              <div className="flex items-center justify-between text-sm">
                <span>{cat.icon} {cat.name}</span>
                <span className="font-medium">{fmt(cat.total)} ({cat.percentage}%)</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
          {report.categories.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum gasto no período</p>
          )}
        </div>
      </div>

      {/* Daily spending chart */}
      {report.dailySpending.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Gastos diários</h3>
          <div className="flex h-32 items-end gap-0.5 overflow-x-auto">
            {report.dailySpending.map(day => (
              <div
                key={day.date}
                className="group relative flex-1 rounded-t bg-primary/60 transition-colors hover:bg-primary"
                style={{ height: `${(day.amount / maxDailySpending) * 100}%`, minHeight: '2px' }}
                title={`${day.date}: ${fmt(day.amount)}`}
              >
                <div className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-xs text-background group-hover:block">
                  {fmt(day.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top expenses */}
      {report.topExpenses.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Maiores gastos</h3>
          <div className="space-y-2">
            {report.topExpenses.map((tx, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <div>
                  <span className="mr-2 text-sm font-medium text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm">{tx.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{fmt(tx.amount)}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: number;
  change?: number;
  positive?: boolean;
}) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${value >= 0 ? '' : 'text-red-600'}`}>
        {fmt(Math.abs(value))}
      </p>
      {change !== undefined && change !== 0 && (
        <div className={`flex items-center gap-0.5 text-xs ${
          (positive && change > 0) || (!positive && change < 0) ? 'text-green-600' : 'text-red-600'
        }`}>
          {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(change)}% vs mês anterior
        </div>
      )}
    </div>
  );
}

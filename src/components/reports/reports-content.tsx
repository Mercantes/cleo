'use client';

import { useState } from 'react';
import { MonthlyReport } from './monthly-report';
import { MonthComparison } from './month-comparison';

type Tab = 'report' | 'compare';

export function ReportsContent() {
  const [tab, setTab] = useState<Tab>('report');

  return (
    <div>
      <div className="mb-6">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setTab('report')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'report' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Relatório Mensal
          </button>
          <button
            onClick={() => setTab('compare')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === 'compare' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Comparar Meses
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          {tab === 'report' ? 'Análise detalhada das suas finanças no mês' : 'Compare receitas, despesas e economia entre dois meses'}
        </p>
      </div>

      {tab === 'report' && <MonthlyReport />}
      {tab === 'compare' && <MonthComparison />}
    </div>
  );
}

'use client';

import { ReportsContent } from '@/components/reports/reports-content';
import { ProGate } from '@/components/paywall/pro-gate';

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Relatório mensal e comparação entre meses
        </p>
      </div>
      <ProGate feature="Relatórios financeiros">
        <ReportsContent />
      </ProGate>
    </div>
  );
}

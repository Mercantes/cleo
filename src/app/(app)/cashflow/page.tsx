'use client';

import { CashFlowContent } from '@/components/cashflow/cashflow-content';

export default function CashFlowPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe entradas, saídas e saldo acumulado dia a dia.
        </p>
      </div>
      <CashFlowContent />
    </div>
  );
}

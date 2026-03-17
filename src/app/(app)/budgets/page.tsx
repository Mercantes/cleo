'use client';

import { BudgetsContent } from '@/components/budgets/budgets-content';
import { ProGate } from '@/components/paywall/pro-gate';

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina limites de gastos por categoria e acompanhe seu progresso
        </p>
      </div>
      <ProGate feature="Orçamentos por categoria">
        <BudgetsContent />
      </ProGate>
    </div>
  );
}

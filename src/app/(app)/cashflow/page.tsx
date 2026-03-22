import type { Metadata } from 'next';
import { CashFlowContent } from '@/components/cashflow/cashflow-content';

export const metadata: Metadata = { title: 'Fluxo de Caixa' };

export default function CashFlowPage() {
  return (
    <div className="space-y-6">
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

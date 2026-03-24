import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { BudgetsContent } from '@/components/budgets/budgets-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Orçamentos' };

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/goals"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Metas & Orçamentos
        </Link>
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

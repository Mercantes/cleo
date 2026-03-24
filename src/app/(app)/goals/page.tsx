import type { Metadata } from 'next';
import Link from 'next/link';
import { GoalsContent } from '@/components/goals/goals-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Metas' };

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe seu progresso de economia mensal
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/budgets"
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Orçamentos
          </Link>
          <Link
            href="/challenges"
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Desafios
          </Link>
        </div>
      </div>
      <ProGate feature="Metas e gamificação">
        <GoalsContent />
      </ProGate>
    </div>
  );
}

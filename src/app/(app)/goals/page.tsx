import type { Metadata } from 'next';
import { GoalsContent } from '@/components/goals/goals-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Metas' };

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe seu progresso de economia mensal
        </p>
      </div>
      <ProGate feature="Metas e gamificação">
        <GoalsContent />
      </ProGate>
    </div>
  );
}

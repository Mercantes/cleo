import type { Metadata } from 'next';
import { RetirementContent } from '@/components/retirement/retirement-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Patrimônio' };

export default function RetirementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patrimônio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Calcule quanto tempo falta para sua independência financeira
        </p>
      </div>
      <ProGate feature="Simulação de aposentadoria FIRE">
        <RetirementContent />
      </ProGate>
    </div>
  );
}

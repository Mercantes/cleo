import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RetirementContent } from '@/components/retirement/retirement-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Patrimônio' };

export default function RetirementPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projections"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Futuro
        </Link>
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

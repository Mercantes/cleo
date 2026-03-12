import type { Metadata } from 'next';
import { RetirementContent } from '@/components/retirement/retirement-content';

export const metadata: Metadata = {
  title: 'Aposentadoria FIRE',
};

export default function RetirementPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aposentadoria FIRE</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Calcule quanto tempo falta para sua independência financeira
        </p>
      </div>
      <RetirementContent />
    </div>
  );
}

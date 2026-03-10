import { RetirementContent } from '@/components/retirement/retirement-content';

export default function RetirementPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">Aposentadoria FIRE</h1>
      <p className="text-sm text-muted-foreground">
        Calcule quanto tempo falta para sua independência financeira
      </p>
      <RetirementContent />
    </div>
  );
}

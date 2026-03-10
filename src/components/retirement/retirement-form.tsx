'use client';

interface RetirementFormProps {
  values: { targetMonthlyIncome: number; annualReturnRate: number; currentPortfolio: number };
  onChange: (values: RetirementFormProps['values']) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function RetirementForm({ values, onChange, onSubmit, loading }: RetirementFormProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">Parâmetros</h2>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Renda mensal desejada na aposentadoria</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              value={values.targetMonthlyIncome}
              onChange={(e) => onChange({ ...values, targetMonthlyIncome: Number(e.target.value) })}
              className="w-full rounded-md border bg-background px-3 py-2 pl-9 text-sm"
              min={0}
              step={500}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Retorno anual esperado (%)</label>
          <input
            type="number"
            value={(values.annualReturnRate * 100).toFixed(0)}
            onChange={(e) => onChange({ ...values, annualReturnRate: Number(e.target.value) / 100 })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            min={0}
            max={30}
            step={1}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Total investido atualmente</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              value={values.currentPortfolio}
              onChange={(e) => onChange({ ...values, currentPortfolio: Number(e.target.value) })}
              className="w-full rounded-md border bg-background px-3 py-2 pl-9 text-sm"
              min={0}
              step={1000}
            />
          </div>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Calculando...' : 'Calcular'}
      </button>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
          <label htmlFor="target-income" className="text-xs text-muted-foreground">
            Renda mensal desejada na aposentadoria
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id="target-income"
              type="number"
              value={values.targetMonthlyIncome}
              onChange={(e) => onChange({ ...values, targetMonthlyIncome: Number(e.target.value) })}
              className="pl-9"
              min={0}
              step={500}
            />
          </div>
        </div>
        <div>
          <label htmlFor="return-rate" className="text-xs text-muted-foreground">
            Retorno anual esperado (%)
          </label>
          <Input
            id="return-rate"
            type="number"
            value={(values.annualReturnRate * 100).toFixed(0)}
            onChange={(e) => onChange({ ...values, annualReturnRate: Number(e.target.value) / 100 })}
            className="mt-1"
            min={0}
            max={30}
            step={1}
          />
        </div>
        <div>
          <label htmlFor="current-portfolio" className="text-xs text-muted-foreground">
            Total investido atualmente
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id="current-portfolio"
              type="number"
              value={values.currentPortfolio}
              onChange={(e) => onChange({ ...values, currentPortfolio: Number(e.target.value) })}
              className="pl-9"
              min={0}
              step={1000}
            />
          </div>
        </div>
      </div>
      <Button onClick={onSubmit} disabled={loading} className="w-full">
        {loading ? 'Calculando...' : 'Calcular'}
      </Button>
    </div>
  );
}

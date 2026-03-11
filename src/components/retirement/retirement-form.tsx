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
          <p id="target-income-hint" className="text-[10px] text-muted-foreground/70">Quanto você quer receber por mês ao se aposentar</p>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id="target-income"
              type="number"
              value={values.targetMonthlyIncome}
              onChange={(e) => onChange({ ...values, targetMonthlyIncome: Number(e.target.value) })}
              aria-describedby="target-income-hint"
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
          <p id="return-rate-hint" className="text-[10px] text-muted-foreground/70">Renda fixa ~10%, ações ~12%, misto ~8%</p>
          <Input
            id="return-rate"
            type="number"
            value={(values.annualReturnRate * 100).toFixed(0)}
            onChange={(e) => onChange({ ...values, annualReturnRate: Number(e.target.value) / 100 })}
            aria-describedby="return-rate-hint"
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
          <p id="current-portfolio-hint" className="text-[10px] text-muted-foreground/70">Soma de todos os seus investimentos hoje</p>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id="current-portfolio"
              type="number"
              value={values.currentPortfolio}
              onChange={(e) => onChange({ ...values, currentPortfolio: Number(e.target.value) })}
              aria-describedby="current-portfolio-hint"
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

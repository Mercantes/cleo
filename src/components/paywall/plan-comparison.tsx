'use client';

import { Check, X } from 'lucide-react';

const PLAN_FEATURES = [
  { name: 'Transações por mês', free: '100', pro: 'Ilimitado' },
  { name: 'Mensagens de chat IA', free: '30/mês', pro: 'Ilimitado' },
  { name: 'Conexões bancárias', free: '1', pro: 'Ilimitado' },
  { name: 'Projeções patrimoniais', free: true, pro: true },
  { name: 'Calculadora de aposentadoria', free: true, pro: true },
  { name: 'Exportação de dados', free: false, pro: true },
  { name: 'Suporte prioritário', free: false, pro: true },
];

interface PlanComparisonProps {
  onSelectPro: () => void;
  loading?: boolean;
}

export function PlanComparison({ onSelectPro, loading }: PlanComparisonProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Free Plan */}
      <div className="rounded-xl border p-6">
        <h3 className="text-lg font-semibold">Free</h3>
        <p className="mt-1 text-sm text-muted-foreground">Para começar a organizar suas finanças</p>
        <p className="mt-4 text-3xl font-bold">
          R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span>
        </p>

        <div className="mt-6 space-y-3">
          {PLAN_FEATURES.map((feature) => (
            <div key={feature.name} className="flex items-center gap-2 text-sm">
              {feature.free === false ? (
                <X className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
              <span className={feature.free === false ? 'text-muted-foreground' : ''}>
                {feature.name}
                {typeof feature.free === 'string' && (
                  <span className="ml-1 text-muted-foreground">({feature.free})</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <button
          disabled
          className="mt-6 w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground"
        >
          Plano atual
        </button>
      </div>

      {/* Pro Plan */}
      <div className="relative rounded-xl border-2 border-primary p-6">
        <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Recomendado
        </span>
        <h3 className="text-lg font-semibold">Pro</h3>
        <p className="mt-1 text-sm text-muted-foreground">Controle total das suas finanças</p>
        <p className="mt-4 text-3xl font-bold">
          R$ 19,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
        </p>

        <div className="mt-6 space-y-3">
          {PLAN_FEATURES.map((feature) => (
            <div key={feature.name} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>
                {feature.name}
                {typeof feature.pro === 'string' && (
                  <span className="ml-1 font-medium text-primary">({feature.pro})</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onSelectPro}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Redirecionando...' : 'Começar Pro'}
        </button>
      </div>
    </div>
  );
}

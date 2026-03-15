'use client';

import { useState } from 'react';
import { Check, Minus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BillingCycle = 'monthly' | 'annual';

const PLANS = {
  free: {
    name: 'Grátis',
    subtitle: '1 Conexão bancária',
    monthly: 0,
    annual: 0,
    description: 'Visualização básica das suas finanças.',
    cta: null,
    ctaNote: null,
  },
  pro: {
    name: 'Pro',
    subtitle: 'Até 3 Conexões bancárias',
    monthly: 19.90,
    annual: 16.58,
    description: 'Suas finanças no piloto automático. Conexão, categorização e controle total.',
    cta: 'Teste grátis',
    ctaNote: '7 dias grátis — sem cartão de crédito',
  },
  premium: {
    name: 'Premium',
    subtitle: 'Conexões ilimitadas',
    monthly: 39.90,
    annual: 33.25,
    description: 'Todas as suas contas em um só lugar. Conecte suas contas PJ e tenha uma visão completa.',
    cta: 'Teste grátis',
    ctaNote: '7 dias grátis — sem cartão de crédito',
  },
};

interface Feature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
}

const PLAN_FEATURES: Feature[] = [
  { name: 'Categorização automática de transações', free: true, pro: true, premium: true },
  { name: 'Transações e contas manuais', free: true, pro: true, premium: true },
  { name: 'Suporte via e-mail', free: true, pro: false, premium: false },
  { name: 'Suporte via e-mail e chat', free: false, pro: true, premium: true },
  { name: 'Acesso completo à plataforma', free: false, pro: true, premium: true },
  { name: 'Sincronizações via Open Finance', free: '1x/dia', pro: 'Todas', premium: 'Todas' },
  { name: 'Histórico completo', free: false, pro: true, premium: true },
  { name: 'Detecção de parcelas e assinaturas', free: false, pro: true, premium: true },
  { name: 'Regras customizadas', free: false, pro: true, premium: true },
  { name: 'Tags', free: false, pro: true, premium: true },
  { name: 'Projeção de saldo (12 meses)', free: false, pro: true, premium: true },
  { name: 'Conecte suas contas PJs', free: false, pro: false, premium: true },
  { name: 'Assistente de IA', free: false, pro: true, premium: true },
];

interface ComparisonRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  premium: string | boolean;
}

const COMPARISON_TABLE: ComparisonRow[] = [
  { name: 'Contas conectadas', free: '1', pro: '3', premium: 'Ilimitado' },
  { name: 'Conexões PJ (empresas)', free: false, pro: false, premium: true },
  { name: 'Sincronização automática', free: false, pro: true, premium: true },
  { name: 'Categorização automática', free: false, pro: true, premium: true },
  { name: 'Insights de gastos', free: false, pro: true, premium: true },
  { name: 'Detecção de recorrentes', free: false, pro: true, premium: true },
  { name: 'Regras de automação', free: false, pro: true, premium: true },
  { name: 'Tags', free: false, pro: true, premium: true },
  { name: 'Projeção de saldo', free: false, pro: true, premium: true },
  { name: 'Suporte prioritário', free: false, pro: true, premium: true },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/40" />;
  if (value === true) return <Check className="h-4 w-4 text-green-500" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PlanComparisonProps {
  onSelectPro: () => void;
  loading?: boolean;
}

export function PlanComparison({ onSelectPro, loading }: PlanComparisonProps) {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const isAnnual = billing === 'annual';

  return (
    <div className="space-y-12">
      {/* Billing toggle */}
      <div className="flex flex-col items-center gap-2">
        {isAnnual && (
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-500">
            2 meses grátis
          </span>
        )}
        <div className="inline-flex rounded-lg border bg-muted/50 p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              !isAnnual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              isAnnual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Anual
            <span className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-bold',
              isAnnual ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-green-500/15 text-green-500',
            )}>
              17% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Free */}
        <div className="flex flex-col rounded-xl border p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano</p>
            <h3 className="text-2xl font-bold">{PLANS.free.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{PLANS.free.subtitle}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            {PLAN_FEATURES.map((f) => (
              <div key={f.name} className="flex items-start gap-2 text-sm">
                <FeatureIcon value={f.free} />
                <span className={f.free === false ? 'text-muted-foreground/50 line-through' : ''}>
                  {f.name}
                  {typeof f.free === 'string' && <span className="ml-1 text-xs text-muted-foreground">({f.free})</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-bold">
              R$ 0,00
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{PLANS.free.description}</p>
            <Button variant="outline" disabled className="mt-4 w-full">
              Plano Atual
            </Button>
          </div>
        </div>

        {/* Pro */}
        <div className="flex flex-col rounded-xl border-2 border-primary/50 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano</p>
            <h3 className="text-2xl font-bold">{PLANS.pro.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{PLANS.pro.subtitle}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            {PLAN_FEATURES.map((f) => (
              <div key={f.name} className="flex items-start gap-2 text-sm">
                <FeatureIcon value={f.pro} />
                <span className={f.pro === false ? 'text-muted-foreground/50 line-through' : ''}>
                  {f.name}
                  {typeof f.pro === 'string' && <span className="ml-1 text-xs text-muted-foreground">({f.pro})</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-bold">
              R$ {formatPrice(isAnnual ? PLANS.pro.annual : PLANS.pro.monthly)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{PLANS.pro.description}</p>
            <Button onClick={onSelectPro} disabled={loading} className="mt-4 w-full">
              {loading ? 'Redirecionando...' : PLANS.pro.cta}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{PLANS.pro.ctaNote}</p>
          </div>
        </div>

        {/* Premium */}
        <div className="relative flex flex-col rounded-xl border-2 border-primary p-6">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            MELHOR OFERTA
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano</p>
            <h3 className="flex items-center gap-2 text-2xl font-bold">
              {PLANS.premium.name}
              <Crown className="h-5 w-5 text-primary" />
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{PLANS.premium.subtitle}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            {PLAN_FEATURES.map((f) => (
              <div key={f.name} className="flex items-start gap-2 text-sm">
                <FeatureIcon value={f.premium} />
                <span className={f.premium === false ? 'text-muted-foreground/50 line-through' : ''}>
                  {f.name}
                  {typeof f.premium === 'string' && <span className="ml-1 text-xs text-muted-foreground">({f.premium})</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-bold">
              R$ {formatPrice(isAnnual ? PLANS.premium.annual : PLANS.premium.monthly)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{PLANS.premium.description}</p>
            <Button onClick={onSelectPro} disabled={loading} className="mt-4 w-full">
              {loading ? 'Redirecionando...' : PLANS.premium.cta}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{PLANS.premium.ctaNote}</p>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="space-y-4">
        <h2 className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Comparar Planos
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_5rem_5rem_6rem] items-center gap-2 border-b px-4 py-3 text-sm font-semibold sm:grid-cols-[1fr_6rem_6rem_7rem]">
            <span />
            <span className="text-center text-muted-foreground">Grátis</span>
            <span className="text-center text-primary">Pro</span>
            <span className="text-center text-primary font-bold">Premium</span>
          </div>
          {/* Table rows */}
          {COMPARISON_TABLE.map((row, i) => (
            <div
              key={row.name}
              className={cn(
                'grid grid-cols-[1fr_5rem_5rem_6rem] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_6rem_6rem_7rem]',
                i < COMPARISON_TABLE.length - 1 && 'border-b',
              )}
            >
              <span>{row.name}</span>
              <span className="flex justify-center">
                {typeof row.free === 'string' ? (
                  <span className="text-xs text-muted-foreground">{row.free}</span>
                ) : row.free ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <span className="flex justify-center">
                {typeof row.pro === 'string' ? (
                  <span className="text-xs font-medium text-primary">{row.pro}</span>
                ) : row.pro ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
              <span className="flex justify-center">
                {typeof row.premium === 'string' ? (
                  <span className="text-xs font-medium text-primary">{row.premium}</span>
                ) : row.premium ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ / Support link */}
      <p className="text-center text-sm text-muted-foreground">
        Tem alguma dúvida?{' '}
        <a href="/support" className="font-medium text-primary hover:underline">
          Fale com o suporte
        </a>
      </p>
    </div>
  );
}

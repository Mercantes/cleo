'use client';

import { useState } from 'react';
import { Check, AlertCircle, X, Crown } from 'lucide-react';
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
    monthly: 19.9,
    annual: 16.58,
    description: 'Suas finanças no piloto automático.',
    cta: 'Teste grátis',
    ctaNote: '7 dias grátis — sem cartão de crédito',
  },
  premium: {
    name: 'Premium',
    subtitle: 'Conexões ilimitadas',
    monthly: 39.9,
    annual: 33.25,
    description: 'Todas as suas contas em um só lugar.',
    cta: 'Teste grátis',
    ctaNote: '7 dias grátis — sem cartão de crédito',
  },
};

type FeatureStatus = 'included' | 'limited' | 'excluded';

interface PlanFeature {
  label: string;
  detail?: string;
  status: FeatureStatus;
}

const FREE_FEATURES: PlanFeature[] = [
  { label: '1 Conexão', status: 'included' },
  { label: 'Categorização automática', status: 'included' },
  { label: 'Transações e contas manuais', status: 'included' },
  { label: 'Assistente de IA (10 msgs/mês)', status: 'limited' },
  { label: 'Acesso limitado à dashboard', status: 'limited' },
  { label: 'Atualização a cada 24h', status: 'limited' },
  { label: 'Histórico dos últimos 30D', status: 'limited' },
  { label: '3 próximas parcelas e assinaturas', status: 'limited' },
  { label: 'Suporte prioritário', status: 'excluded' },
  { label: 'Regras customizadas', status: 'excluded' },
  { label: 'Tags', status: 'excluded' },
  { label: 'Projeção de saldo', status: 'excluded' },
  { label: 'Conecte suas contas PJs', status: 'excluded' },
];

const PRO_FEATURES: PlanFeature[] = [
  { label: 'Até 3 Conexões', status: 'included' },
  { label: 'Categorização automática', status: 'included' },
  { label: 'Transações e contas manuais', status: 'included' },
  { label: 'Assistente de IA (50 msgs/mês)', status: 'included' },
  { label: 'Acesso completo à plataforma', status: 'included' },
  { label: 'Sincronização em tempo real', status: 'included' },
  { label: 'Histórico completo', status: 'included' },
  { label: 'Detecção de parcelas e assinaturas', status: 'included' },
  { label: 'Suporte via e-mail e chat', status: 'included' },
  { label: 'Regras customizadas', status: 'included' },
  { label: 'Tags', status: 'included' },
  { label: 'Projeção de saldo (12 meses)', status: 'included' },
  { label: 'Conecte suas contas PJs', status: 'excluded' },
];

const PREMIUM_FEATURES: PlanFeature[] = [
  { label: 'Conexões ilimitadas', status: 'included' },
  { label: 'Categorização automática', status: 'included' },
  { label: 'Transações e contas manuais', status: 'included' },
  { label: 'Assistente de IA ilimitada', status: 'included' },
  { label: 'Acesso completo à plataforma', status: 'included' },
  { label: 'Sincronização em tempo real', status: 'included' },
  { label: 'Histórico completo', status: 'included' },
  { label: 'Detecção de parcelas e assinaturas', status: 'included' },
  { label: 'Suporte via e-mail e chat', status: 'included' },
  { label: 'Regras customizadas', status: 'included' },
  { label: 'Tags', status: 'included' },
  { label: 'Projeção de saldo (12 meses)', status: 'included' },
  { label: 'Conecte suas contas PJs', status: 'included' },
];

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      {feature.status === 'included' && (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      )}
      {feature.status === 'limited' && (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      )}
      {feature.status === 'excluded' && (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30" />
      )}
      <span
        className={cn(feature.status === 'excluded' && 'text-muted-foreground/40 line-through')}
      >
        {feature.label}
      </span>
    </div>
  );
}

interface ComparisonRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  premium: string | boolean;
}

const COMPARISON_TABLE: ComparisonRow[] = [
  { name: 'Contas conectadas', free: '1', pro: '3', premium: 'Ilimitado' },
  { name: 'Histórico', free: '30 dias', pro: 'Completo', premium: 'Completo' },
  { name: 'Sincronização', free: '1x/dia', pro: 'Tempo real', premium: 'Tempo real' },
  { name: 'Categorização automática', free: true, pro: true, premium: true },
  { name: 'Detecção de recorrentes', free: '3 próximas', pro: true, premium: true },
  { name: 'Regras e tags', free: false, pro: true, premium: true },
  { name: 'Projeção de saldo', free: false, pro: true, premium: true },
  { name: 'Assistente de IA', free: '10 msgs', pro: '50 msgs', premium: 'Ilimitado' },
  { name: 'Contas PJ', free: false, pro: false, premium: true },
  { name: 'Suporte prioritário', free: false, pro: true, premium: true },
];

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/30" />;
  if (value === true) return <Check className="h-4 w-4 text-green-500" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PlanComparisonProps {
  onSelectPlan: (plan: 'pro' | 'premium') => void;
  loading?: string | null;
  currentTier?: 'free' | 'pro';
}

export function PlanComparison({
  onSelectPlan,
  loading,
  currentTier = 'free',
}: PlanComparisonProps) {
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
              !isAnnual
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              isAnnual
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Anual
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-bold',
                isAnnual
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-green-500/15 text-green-500',
              )}
            >
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plano
            </p>
            <h3 className="text-2xl font-bold">{PLANS.free.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{PLANS.free.subtitle}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </div>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-bold">R$ 0,00</p>
            <p className="mt-1 text-xs text-muted-foreground">{PLANS.free.description}</p>
            <Button variant="outline" disabled className="mt-4 w-full">
              {currentTier === 'free' ? 'Plano Atual' : 'Plano Grátis'}
            </Button>
          </div>
        </div>

        {/* Pro */}
        <div className="flex flex-col rounded-xl border-2 border-primary/50 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plano
            </p>
            <h3 className="text-2xl font-bold">{PLANS.pro.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{PLANS.pro.subtitle}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </div>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-bold">
              R$ {formatPrice(isAnnual ? PLANS.pro.annual : PLANS.pro.monthly)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{PLANS.pro.description}</p>
            {currentTier === 'pro' ? (
              <>
                <Button variant="outline" disabled className="mt-4 w-full">
                  Plano Atual
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={async () => {
                      const res = await fetch('/api/stripe/portal');
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                  >
                    Gerenciar assinatura
                  </button>
                </p>
              </>
            ) : (
              <>
                <Button
                  onClick={() => onSelectPlan('pro')}
                  disabled={loading === 'pro'}
                  className="mt-4 w-full"
                >
                  {loading === 'pro' ? 'Redirecionando...' : PLANS.pro.cta}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  {PLANS.pro.ctaNote}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Premium */}
        <div className="relative flex flex-col rounded-xl border-2 border-primary p-6">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            MELHOR OFERTA
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Plano
            </p>
            <h3 className="flex items-center gap-2 text-2xl font-bold">
              {PLANS.premium.name}
              <Crown className="h-5 w-5 text-primary" />
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{PLANS.premium.subtitle}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </div>

          <div className="mt-auto pt-6">
            <p className="text-3xl font-bold">
              R$ {formatPrice(isAnnual ? PLANS.premium.annual : PLANS.premium.monthly)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{PLANS.premium.description}</p>
            <Button
              onClick={() => onSelectPlan('premium')}
              disabled={loading === 'premium'}
              className="mt-4 w-full"
            >
              {loading === 'premium'
                ? 'Redirecionando...'
                : currentTier === 'pro'
                  ? 'Upgrade para Premium'
                  : PLANS.premium.cta}
            </Button>
            {currentTier !== 'pro' && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                {PLANS.premium.ctaNote}
              </p>
            )}
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
                <ComparisonCell value={row.free} />
              </span>
              <span className="flex justify-center">
                <ComparisonCell value={row.pro} />
              </span>
              <span className="flex justify-center">
                <ComparisonCell value={row.premium} />
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

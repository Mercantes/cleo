'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pricingTiers } from '@/lib/data/pricing';

type BillingCycle = 'monthly' | 'annual';

export function PricingSection() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const isAnnual = billing === 'annual';

  return (
    <section id="planos" className="border-t bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-primary">
          Planos
        </p>
        <h2 className="mt-2 text-center text-3xl font-bold md:text-4xl">
          Suas Finanças no Piloto Automático
        </h2>

        {/* Billing toggle */}
        <div className="mt-8 flex flex-col items-center gap-2">
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
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col rounded-2xl border p-8',
                tier.badge && 'border-2 border-primary',
                tier.highlighted && 'border-2 border-primary/50',
                !tier.highlighted && !tier.badge && 'border',
              )}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {tier.badge}
                </span>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Plano
                </p>
                <h3 className="flex items-center gap-2 text-2xl font-bold">
                  {tier.name}
                  {tier.badge && <Crown className="h-5 w-5 text-primary" />}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.subtitle}</p>
              </div>

              <ul className="mt-6 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <p className="text-3xl font-bold">
                  {tier.annualPrice && isAnnual ? tier.annualPrice : tier.price}
                  {tier.period && (
                    <span className="text-sm font-normal text-muted-foreground">{tier.period}</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{tier.description}</p>
                <Link
                  href="/signup"
                  className={cn(
                    'mt-4 flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    tier.highlighted || tier.badge
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border bg-background hover:bg-muted hover:text-foreground',
                  )}
                >
                  {tier.cta}
                </Link>
                {tier.ctaNote && (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">{tier.ctaNote}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import {
  Smartphone,
  Brain,
  TrendingUp,
  Shield,
  Lock,
  KeyRound,
  Check,
  X,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pricingTiers } from '@/lib/data/pricing';

const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80';
const btnOutline =
  'inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground';

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center md:px-6 md:py-32">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Sua assistente financeira com{' '}
          <span className="text-primary">inteligência artificial</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Conecte seu banco, converse com a Cleo e tome decisões financeiras mais inteligentes.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup" className={cn(btnPrimary, 'h-10 px-8')}>
            Começar grátis
          </Link>
          <a href="#como-funciona" className={cn(btnOutline, 'h-10 px-8')}>
            Saiba mais
          </a>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-center text-3xl font-bold">Por que a Cleo?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Tudo que você precisa para organizar suas finanças em um só lugar.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Smartphone,
                title: 'Dados automáticos',
                description:
                  'Conecte seu banco e veja todas suas transações organizadas automaticamente.',
              },
              {
                icon: Brain,
                title: 'IA contextual',
                description:
                  'Converse com a Cleo sobre suas finanças. Ela conhece seu histórico e dá conselhos personalizados.',
              },
              {
                icon: TrendingUp,
                title: 'Projeções inteligentes',
                description:
                  'Veja para onde seu dinheiro está indo e projete seu patrimônio futuro.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border bg-background p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-center text-3xl font-bold">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Três passos simples para transformar suas finanças.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Conecte',
                description: 'Vincule suas contas bancárias com segurança via Open Finance.',
              },
              {
                step: '2',
                title: 'Pergunte',
                description:
                  'Converse com a Cleo: "Quanto gastei com delivery este mês?"',
              },
              {
                step: '3',
                title: 'Planeje',
                description:
                  'Receba projeções e sugestões para atingir seus objetivos financeiros.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="text-center text-3xl font-bold">Cleo vs alternativas</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Veja como a Cleo se compara a outras opções.
          </p>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium text-muted-foreground">Recurso</th>
                  <th className="pb-3 text-center font-medium text-muted-foreground">Planilha</th>
                  <th className="pb-3 text-center font-medium text-muted-foreground">
                    Outros Apps
                  </th>
                  <th className="pb-3 text-center font-medium text-primary">Cleo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: 'Dados automáticos', planilha: false, outros: true, cleo: true },
                  { feature: 'IA conversacional', planilha: false, outros: false, cleo: true },
                  { feature: 'Projeções', planilha: false, outros: 'partial', cleo: true },
                  { feature: 'Open Finance BR', planilha: false, outros: 'partial', cleo: true },
                  {
                    feature: 'Preço',
                    planilha: 'Grátis',
                    outros: 'R$20-50/mês',
                    cleo: 'Grátis',
                  },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="py-3 font-medium">{row.feature}</td>
                    <td className="py-3 text-center">
                      <ComparisonCell value={row.planilha} />
                    </td>
                    <td className="py-3 text-center">
                      <ComparisonCell value={row.outros} />
                    </td>
                    <td className="py-3 text-center">
                      <ComparisonCell value={row.cleo} highlight />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-center text-3xl font-bold">Segurança em primeiro lugar</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Regulado pelo Banco Central',
                description:
                  'Open Finance é regulado e fiscalizado pelo Banco Central do Brasil.',
              },
              {
                icon: Lock,
                title: 'Dados criptografados',
                description: 'Seus dados são protegidos com criptografia de ponta a ponta.',
              },
              {
                icon: KeyRound,
                title: 'Não armazenamos senhas',
                description:
                  'A conexão é feita diretamente pelo seu banco. Nunca pedimos sua senha.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="text-center text-3xl font-bold">Planos</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Comece grátis. Faça upgrade quando quiser.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  'rounded-lg border bg-background p-8',
                  tier.highlighted && 'border-primary ring-1 ring-primary',
                )}
              >
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    'mt-8 flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    tier.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                      : 'border border-border bg-background hover:bg-muted hover:text-foreground',
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="text-3xl font-bold">Pronto para transformar suas finanças?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece agora e tenha controle total das suas finanças com a ajuda da inteligência artificial.
          </p>
          <Link href="/signup" className={cn(btnPrimary, 'mt-8 h-10 px-8')}>
            Começar grátis
          </Link>
        </div>
      </section>
    </>
  );
}

function ComparisonCell({
  value,
  highlight,
}: {
  value: boolean | string;
  highlight?: boolean;
}) {
  if (typeof value === 'string') {
    return <span className={highlight ? 'font-semibold text-primary' : ''}>{value}</span>;
  }
  if (value === true) {
    return (
      <Check className={cn('mx-auto h-5 w-5', highlight ? 'text-primary' : 'text-green-500')} />
    );
  }
  if (value === false) {
    return <X className="mx-auto h-5 w-5 text-muted-foreground/50" />;
  }
  return <Minus className="mx-auto h-5 w-5 text-muted-foreground" />;
}

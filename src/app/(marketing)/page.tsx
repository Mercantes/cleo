import Link from 'next/link';
import Image from 'next/image';
import {
  Smartphone,
  Brain,
  TrendingUp,
  BarChart3,
  Repeat,
  Shield,
  Lock,
  KeyRound,
  Eye,
  Scale,
  Server,
  ArrowRight,
  Sparkles,
  MessageSquare,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingSection } from '@/components/marketing/pricing-section';
import { BankLogos } from '@/components/marketing/bank-logos';
import { HowItWorksStep } from '@/components/marketing/how-it-works-step';

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cleo',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'Assistente financeira com inteligência artificial. Conecte seu banco, converse com IA e tome decisões financeiras mais inteligentes.',
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Gratuito' },
      { '@type': 'Offer', price: '19.90', priceCurrency: 'BRL', name: 'Pro', billingPeriod: 'P1M' },
      { '@type': 'Offer', price: '39.90', priceCurrency: 'BRL', name: 'Premium', billingPeriod: 'P1M' },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 md:px-6 md:pb-24 md:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Suas finanças no piloto automático
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-[56px] lg:leading-[1.1]">
                Veja seu futuro financeiro,{' '}
                <span className="text-primary">não só seu passado.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Conecte suas contas, veja seus gastos organizados, e saiba se você pode fazer aquela viagem com um único aplicativo.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                >
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Grátis para sempre — sem cartão de crédito
              </p>
            </div>

            {/* App Preview */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl border bg-background/80 p-4 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-2 border-b pb-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto rounded-md bg-muted px-4 py-1 text-xs text-muted-foreground">
                    app.usecleo.com.br
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo total</p>
                      <p className="text-2xl font-bold">R$ 12.458,32</p>
                    </div>
                    <div className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                      +8,2% este mês
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-[10px] text-muted-foreground">Receitas</p>
                      <p className="text-sm font-semibold text-green-600">R$ 8.500</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-[10px] text-muted-foreground">Despesas</p>
                      <p className="text-sm font-semibold text-red-500">R$ 5.230</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-[10px] text-muted-foreground">Economia</p>
                      <p className="text-sm font-semibold text-primary">R$ 3.270</p>
                    </div>
                  </div>
                  {/* Mini chart */}
                  <div className="flex h-24 items-end gap-1">
                    {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-primary/20" style={{ height: `${h}%` }}>
                        <div className="w-full rounded-t bg-primary transition-all" style={{ height: `${Math.min(h + 10, 100)}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 -left-8 rounded-xl border bg-background p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Cleo IA</p>
                    <p className="text-[10px] text-muted-foreground">&ldquo;Você economizou 12% este mês!&rdquo;</p>
                  </div>
                </div>
              </div>
              {/* Floating categorization */}
              <div className="absolute -right-4 top-12 rounded-xl border bg-background p-3 shadow-lg">
                <p className="text-[10px] font-medium text-muted-foreground">Categorizado automaticamente</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-xs font-medium">Alimentação</span>
                  <span className="text-xs text-muted-foreground">R$ 847</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bank logos trust bar */}
      <BankLogos />

      {/* Features */}
      <section id="funcionalidades" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-primary">
            Funcionalidades
          </p>
          <h2 className="mx-auto mt-2 max-w-xl text-center text-3xl font-bold md:text-4xl">
            Tome Melhores Decisões Financeiras sem Esforço
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-t bg-muted/30 py-20 md:py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Como funciona
            </p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">
              Configure em minutos.{' '}
              <span className="text-primary">Tenha clareza para sempre.</span>
            </h2>
          </div>

          <div className="relative mt-16">
            {/* Connecting line between steps */}
            <div className="absolute left-[19px] top-0 hidden h-full w-px border-l-2 border-dashed border-primary/20 lg:block" />

            <div className="space-y-16 md:space-y-20">
              {STEPS.map((step, i) => {
                const isReversed = i % 2 === 1;
                const StepIcon = step.icon;
                return (
                  <HowItWorksStep key={step.title} index={i}>
                    <div className={cn(
                      'flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12',
                      isReversed && 'lg:flex-row-reverse',
                    )}>
                      {/* Text side */}
                      <div className="flex-1 lg:max-w-md">
                        <div className="flex items-start gap-4">
                          <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
                            {i + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <StepIcon className="h-4 w-4 text-primary" />
                              <h3 className="text-xl font-bold">{step.title}</h3>
                            </div>
                            <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
                            {step.detail && (
                              <p className="mt-2 text-sm text-muted-foreground/70">{step.detail}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Screenshot side */}
                      <div className="flex-1">
                        <div className={cn(
                          'group relative',
                          isReversed ? 'lg:pr-4' : 'lg:pl-4',
                        )}>
                          {/* Green glow behind */}
                          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
                          {/* Screenshot container with perspective */}
                          <div
                            className={cn(
                              'relative overflow-hidden rounded-xl border border-border/50 bg-background shadow-2xl shadow-black/20 transition-transform duration-500 group-hover:scale-[1.02]',
                              i === 0 && 'lg:[transform:perspective(1200px)_rotateY(-3deg)]',
                              i === 1 && 'lg:[transform:perspective(1200px)_rotateY(3deg)]',
                              i === 2 && 'lg:[transform:perspective(1200px)_rotateY(-3deg)]',
                            )}
                          >
                            {/* Gradient fade on edges */}
                            <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-inset ring-white/10" />
                            <Image
                              src={step.screenshot}
                              alt={step.title}
                              width={1920}
                              height={1080}
                              className="w-full"
                              unoptimized
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </HowItWorksStep>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="seguranca" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-primary">
            Segurança
          </p>
          <h2 className="mx-auto mt-2 max-w-lg text-center text-3xl font-bold md:text-4xl">
            Segurança e Privacidade
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing (client component) */}
      <PricingSection />

      {/* FAQ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-primary">
            Dúvidas
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold md:text-4xl">Perguntas frequentes</h2>
          <div className="mt-12 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border bg-background px-6 py-4 transition-all hover:border-primary/20"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {item.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-180">
                    &#9662;
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t bg-gradient-to-b from-primary/5 to-transparent py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold md:text-4xl">
            Pronto para transformar suas finanças?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece agora e tenha controle total com a ajuda da inteligência artificial.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Começar grátis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Cancele a qualquer momento. Sem compromisso.
          </p>
        </div>
      </section>
    </>
  );
}

/* ─── Data ─── */

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Visão completa',
    description: 'Todas as suas contas em um só lugar. Veja seu patrimônio total atualizado automaticamente.',
  },
  {
    icon: TrendingUp,
    title: 'Projeções de futuro',
    description: 'Quanto vai ter em 6 e 12 meses? Receba projeções automáticas baseadas no seu comportamento real.',
  },
  {
    icon: Brain,
    title: 'Planejamento inteligente',
    description: 'Descubra quanto pode economizar, quando ajustar gastos e como atingir suas metas financeiras.',
  },
  {
    icon: Repeat,
    title: 'Detecção de recorrentes',
    description: 'Identifica automaticamente parcelas e assinaturas. Nunca mais se surpreenda com cobranças repetidas.',
  },
  {
    icon: PieChart,
    title: 'Categorização automática',
    description: 'Suas transações são categorizadas por IA. Entenda exatamente para onde seu dinheiro está indo.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios e insights',
    description: 'Gráficos, tendências e análises que transformam dados financeiros em decisões concretas.',
  },
];

const STEPS = [
  {
    title: 'Conecte suas contas',
    description: 'Integração segura via Open Finance com todos os principais bancos do Brasil. Leva menos de 2 minutos.',
    detail: 'Nubank, Itaú, Bradesco, Santander, BTG, Inter e mais.',
    icon: Smartphone,
    screenshot: '/screenshots/contas.png',
  },
  {
    title: 'Tenha clareza instantânea',
    description: 'Categorização automática, análise de recorrentes e organização total — sem trabalho manual nenhum.',
    icon: PieChart,
    screenshot: '/screenshots/dashboard.png',
  },
  {
    title: 'Tome decisões com confiança',
    description: 'Projeções inteligentes, metas e o assistente Cleo IA para responder qualquer dúvida sobre suas finanças.',
    icon: MessageSquare,
    screenshot: '/screenshots/chat.png',
  },
];

const SECURITY_FEATURES = [
  {
    icon: Shield,
    title: 'Open Finance Regulado',
    description: 'Operamos via Open Finance, regulado pelo Banco Central. Seus dados são compartilhados com seu consentimento explícito.',
  },
  {
    icon: Lock,
    title: 'Criptografia AES-256',
    description: 'Utilizamos o mesmo padrão de criptografia de instituições financeiras para proteger seus dados.',
  },
  {
    icon: KeyRound,
    title: 'Acessos sem senhas',
    description: 'Utilizamos OAuth 2.0. É o seu banco que faz a autenticação — nunca pedimos sua senha bancária.',
  },
  {
    icon: Eye,
    title: 'Acesso Read-Only',
    description: 'Nossa integração apenas visualiza dados. Não é possível movimentar dinheiro, fazer transferências ou pagamentos.',
  },
  {
    icon: Scale,
    title: 'Conformidade LGPD',
    description: 'Seus dados estão em total conformidade com a Lei Geral de Proteção de Dados (LGPD).',
  },
  {
    icon: Server,
    title: 'Servidores no Brasil',
    description: 'A plataforma é hospedada em servidores em São Paulo, garantindo baixa latência e seus dados sempre no Brasil.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'A Cleo é realmente gratuita?',
    a: 'Sim! O plano gratuito inclui 1 conta bancária e acesso básico à plataforma. Para recursos avançados como IA, projeções e múltiplas contas, oferecemos os planos Pro (R$19,90/mês) e Premium (R$39,90/mês) com 7 dias grátis.',
  },
  {
    q: 'Como funciona a conexão com o banco?',
    a: 'Usamos o Open Finance, regulado pelo Banco Central do Brasil. A conexão é feita diretamente pelo seu banco — nunca pedimos ou armazenamos sua senha bancária.',
  },
  {
    q: 'Meus dados estão seguros?',
    a: 'Absolutamente. Seus dados são criptografados com AES-256, em trânsito e em repouso. Usamos Row Level Security para garantir que cada usuário acesse apenas seus próprios dados. Servidores no Brasil, LGPD compliant.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa ou carência. Você pode cancelar pelo próprio painel de configurações e continuará com acesso até o fim do período pago.',
  },
  {
    q: 'A IA da Cleo substitui um consultor financeiro?',
    a: 'Não. A Cleo ajuda a organizar suas finanças e oferece insights baseados nos seus dados, mas não substitui aconselhamento financeiro profissional.',
  },
  {
    q: 'Quais bancos são suportados?',
    a: 'Suportamos todos os bancos participantes do Open Finance Brasil, incluindo Nubank, Itaú, Bradesco, Santander, BTG, Inter, C6 Bank, Safra e muitos outros.',
  },
];

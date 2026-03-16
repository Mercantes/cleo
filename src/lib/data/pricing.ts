export interface PricingTier {
  name: string;
  price: string;
  annualPrice?: string;
  period: string;
  subtitle: string;
  description: string;
  features: string[];
  cta: string;
  ctaNote?: string;
  highlighted?: boolean;
  badge?: string;
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Grátis',
    price: 'R$ 0,00',
    period: '',
    subtitle: '1 Conexão bancária',
    description: 'Visualização básica das suas finanças.',
    features: [
      '1 conexão bancária',
      'Categorização automática',
      'Transações e contas manuais',
      'Suporte via e-mail',
      'Sincronização 1x/dia',
    ],
    cta: 'Criar conta',
  },
  {
    name: 'Pro',
    price: 'R$ 19,90',
    annualPrice: 'R$ 16,58',
    period: '/mês',
    subtitle: 'Até 3 Conexões bancárias',
    description: 'Suas finanças no piloto automático.',
    features: [
      'Até 3 conexões bancárias',
      'Categorização automática',
      'Transações e contas manuais',
      'Suporte via e-mail e chat',
      'Acesso completo à plataforma',
      'Histórico completo',
      'Detecção de parcelas e assinaturas',
      'Regras customizadas',
      'Tags',
      'Projeção de saldo (12 meses)',
      'Assistente de IA',
    ],
    cta: 'Criar conta',
    ctaNote: '7 dias grátis — sem cartão de crédito',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: 'R$ 39,90',
    annualPrice: 'R$ 33,25',
    period: '/mês',
    subtitle: 'Conexões ilimitadas',
    description: 'Todas as suas contas em um só lugar.',
    features: [
      'Conexões ilimitadas',
      'Categorização automática',
      'Transações e contas manuais',
      'Suporte via e-mail e chat',
      'Acesso completo à plataforma',
      'Histórico completo',
      'Detecção de parcelas e assinaturas',
      'Regras customizadas',
      'Tags',
      'Projeção de saldo (12 meses)',
      'Conecte suas contas PJs',
      'Assistente de IA',
    ],
    cta: 'Criar conta',
    ctaNote: '7 dias grátis — sem cartão de crédito',
    badge: 'MELHOR OFERTA',
  },
];

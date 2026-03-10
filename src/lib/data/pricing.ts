export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: 'R$0',
    period: '/mês',
    description: 'Para começar a organizar suas finanças.',
    features: [
      '1 conta bancária',
      '100 transações/mês',
      '30 perguntas ao chat/mês',
      'Dashboard básico',
      'Categorização automática',
    ],
    cta: 'Começar grátis',
  },
  {
    name: 'Pro',
    price: 'R$19,90',
    period: '/mês',
    description: 'Para quem quer controle total das finanças.',
    features: [
      'Bancos ilimitados',
      'Perguntas ilimitadas',
      'Projeções avançadas',
      'Planejamento de aposentadoria',
      'Exportação de dados',
      'Dashboard completo',
    ],
    cta: 'Começar com Pro',
    highlighted: true,
  },
];

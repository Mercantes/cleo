import { describe, it, expect } from 'vitest';
import { pricingTiers } from '@/lib/data/pricing';

describe('Pricing Tiers', () => {
  it('should have 2 tiers (Free and Pro)', () => {
    expect(pricingTiers).toHaveLength(2);
    expect(pricingTiers[0].name).toBe('Free');
    expect(pricingTiers[1].name).toBe('Pro');
  });

  it('Free tier should be R$0', () => {
    const free = pricingTiers[0];
    expect(free.price).toBe('R$0');
    expect(free.highlighted).toBeFalsy();
  });

  it('Pro tier should be R$19,90 and highlighted', () => {
    const pro = pricingTiers[1];
    expect(pro.price).toBe('R$19,90');
    expect(pro.highlighted).toBe(true);
  });

  it('Free tier should have expected features', () => {
    const free = pricingTiers[0];
    expect(free.features).toContain('1 conta bancária');
    expect(free.features).toContain('30 perguntas ao chat/mês');
    expect(free.features).toContain('Dashboard básico');
    expect(free.features).toContain('Categorização automática');
  });

  it('Pro tier should have more features than Free', () => {
    expect(pricingTiers[1].features.length).toBeGreaterThan(pricingTiers[0].features.length);
  });

  it('each tier should have required fields', () => {
    for (const tier of pricingTiers) {
      expect(tier.name).toBeTruthy();
      expect(tier.price).toBeTruthy();
      expect(tier.period).toBeTruthy();
      expect(tier.description).toBeTruthy();
      expect(tier.features.length).toBeGreaterThan(0);
      expect(tier.cta).toBeTruthy();
    }
  });
});

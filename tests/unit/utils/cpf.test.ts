import { describe, it, expect } from 'vitest';
import { isValidCPF, formatCPF, stripCPF } from '@/lib/utils/cpf';

describe('isValidCPF', () => {
  it('validates correct CPF', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('rejects invalid CPF', () => {
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('11111111111')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCPF('1234')).toBe(false);
    expect(isValidCPF('')).toBe(false);
    expect(isValidCPF('123456789012')).toBe(false);
  });

  it('rejects all-same-digit CPFs', () => {
    for (let d = 0; d <= 9; d++) {
      expect(isValidCPF(String(d).repeat(11))).toBe(false);
    }
  });
});

describe('formatCPF', () => {
  it('formats partial input progressively', () => {
    expect(formatCPF('529')).toBe('529');
    expect(formatCPF('5299')).toBe('529.9');
    expect(formatCPF('529982')).toBe('529.982');
    expect(formatCPF('5299822')).toBe('529.982.2');
    expect(formatCPF('529982247')).toBe('529.982.247');
    expect(formatCPF('5299822472')).toBe('529.982.247-2');
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('strips non-digits before formatting', () => {
    expect(formatCPF('529.982.247-25')).toBe('529.982.247-25');
  });

  it('limits to 11 digits', () => {
    expect(formatCPF('529982247251234')).toBe('529.982.247-25');
  });
});

describe('stripCPF', () => {
  it('removes mask characters', () => {
    expect(stripCPF('529.982.247-25')).toBe('52998224725');
  });

  it('returns digits as-is', () => {
    expect(stripCPF('52998224725')).toBe('52998224725');
  });
});

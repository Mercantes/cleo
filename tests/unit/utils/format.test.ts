import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatRelativeDate, formatDateGroupLabel } from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('should format positive amount in BRL', () => {
    expect(formatCurrency(1234.56)).toContain('1.234,56');
  });

  it('should format negative amount', () => {
    const result = formatCurrency(-45.9);
    expect(result).toContain('45,90');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toContain('0,00');
  });
});

describe('formatDate', () => {
  it('should format date as DD/MM/YYYY', () => {
    const result = formatDate('2026-03-10');
    expect(result).toBe('10/03/2026');
  });
});

describe('formatRelativeDate', () => {
  it('should return "Hoje" for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatRelativeDate(today)).toBe('Hoje');
  });

  it('should return "Ontem" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    expect(formatRelativeDate(yesterday)).toBe('Ontem');
  });

  it('should return formatted date for older dates', () => {
    const result = formatRelativeDate('2026-01-15');
    expect(result).toBe('15/01/2026');
  });
});

describe('formatDateGroupLabel', () => {
  it('should return "Hoje" for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatDateGroupLabel(today)).toBe('Hoje');
  });

  it('should return "Ontem" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    expect(formatDateGroupLabel(yesterday)).toBe('Ontem');
  });

  it('should return weekday name for dates within last 7 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    const dateStr = threeDaysAgo.toISOString().split('T')[0];
    const result = formatDateGroupLabel(dateStr);
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    expect(weekdays).toContain(result);
  });

  it('should return full date for older dates', () => {
    const result = formatDateGroupLabel('2025-06-15');
    expect(result).toContain('15');
    expect(result).toContain('junho');
    expect(result).toContain('2025');
  });
});

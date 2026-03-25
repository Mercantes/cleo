import { describe, it, expect } from 'vitest';
import { extractPreferences } from '@/lib/ai/preference-engine';

describe('extractPreferences', () => {
  it('detects response style: concise', () => {
    const result = extractPreferences('prefiro respostas curtas');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('response_style');
    expect(result[0].value).toBe('concise');
  });

  it('detects response style: detailed', () => {
    const result = extractPreferences('prefiro respostas detalhadas');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('response_style');
    expect(result[0].value).toBe('detailed');
  });

  it('detects nickname', () => {
    const result = extractPreferences('me chame de João');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('nickname');
    expect(result[0].value).toBe('João');
  });

  it('detects chart preference: disable', () => {
    const result = extractPreferences('não me mostre gráficos');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('show_charts');
    expect(result[0].value).toBe(false);
  });

  it('detects chart preference: enable', () => {
    const result = extractPreferences('quero ver mais gráficos');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('show_charts');
    expect(result[0].value).toBe(true);
  });

  it('detects financial goal: saving', () => {
    const result = extractPreferences('minha prioridade é economizar');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('financial_goal');
    expect(result[0].value).toBe('saving');
  });

  it('detects financial goal: investing', () => {
    const result = extractPreferences('meu foco principal é investir');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('financial_goal');
    expect(result[0].value).toBe('investing');
  });

  it('detects financial goal: debt payoff', () => {
    const result = extractPreferences('minha prioridade é pagar dívidas');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('financial_goal');
    expect(result[0].value).toBe('debt_payoff');
  });

  it('returns empty for unrelated messages', () => {
    const result = extractPreferences('quanto gastei ontem?');
    expect(result).toHaveLength(0);
  });

  it('extracts multiple preferences from one message', () => {
    const result = extractPreferences('prefiro respostas curtas e minha prioridade é economizar');
    expect(result.length).toBeGreaterThanOrEqual(2);
    const keys = result.map((r) => r.key);
    expect(keys).toContain('response_style');
    expect(keys).toContain('financial_goal');
  });
});

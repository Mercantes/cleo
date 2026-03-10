import { describe, it, expect } from 'vitest';
import { parseVisuals, isBarChartData, isPieChartData, isTableData } from '@/lib/ai/visual-types';

describe('parseVisuals', () => {
  it('extracts visual metadata from content', () => {
    const content = 'Seus gastos:\n<!--VISUAL:{"type":"bar","title":"Gastos","data":[{"label":"Jan","value":1000}]}-->\nResumo acima.';
    const result = parseVisuals(content);
    expect(result.visuals).toHaveLength(1);
    expect(result.visuals[0].type).toBe('bar');
    expect(result.visuals[0].title).toBe('Gastos');
    expect(result.text).toBe('Seus gastos:\n\nResumo acima.');
  });

  it('handles multiple visuals', () => {
    const content = '<!--VISUAL:{"type":"bar","title":"A","data":[]}-->texto<!--VISUAL:{"type":"pie","title":"B","data":[]}-->';
    const result = parseVisuals(content);
    expect(result.visuals).toHaveLength(2);
    expect(result.visuals[0].title).toBe('A');
    expect(result.visuals[1].title).toBe('B');
  });

  it('skips invalid JSON', () => {
    const content = 'Texto <!--VISUAL:invalid json--> final';
    const result = parseVisuals(content);
    expect(result.visuals).toHaveLength(0);
    expect(result.text).toBe('Texto  final');
  });

  it('returns original text when no visuals', () => {
    const content = 'Sem visuais aqui.';
    const result = parseVisuals(content);
    expect(result.visuals).toHaveLength(0);
    expect(result.text).toBe('Sem visuais aqui.');
  });
});

describe('type guards', () => {
  it('isBarChartData validates bar chart data', () => {
    expect(isBarChartData([{ label: 'Jan', value: 100 }])).toBe(true);
    expect(isBarChartData([{ name: 'A', value: 100, color: '#fff' }])).toBe(false);
    expect(isBarChartData([])).toBe(false);
  });

  it('isPieChartData validates pie chart data', () => {
    expect(isPieChartData([{ name: 'A', value: 100, color: '#3B82F6' }])).toBe(true);
    expect(isPieChartData([{ label: 'A', value: 100 }])).toBe(false);
    expect(isPieChartData([])).toBe(false);
  });

  it('isTableData validates table data', () => {
    expect(isTableData({ headers: ['A'], rows: [['val']] })).toBe(true);
    expect(isTableData([{ label: 'A' }])).toBe(false);
    expect(isTableData(null)).toBe(false);
  });
});

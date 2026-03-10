export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  label: string;
  value: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface VisualMetadata {
  type: 'bar' | 'line' | 'pie' | 'table';
  title: string;
  data: BarChartData[] | LineChartData[] | PieChartData[] | TableData;
}

export function isBarChartData(data: unknown[]): data is BarChartData[] {
  return data.length > 0 && 'label' in (data[0] as Record<string, unknown>) && 'value' in (data[0] as Record<string, unknown>);
}

export function isPieChartData(data: unknown[]): data is PieChartData[] {
  return data.length > 0 && 'name' in (data[0] as Record<string, unknown>) && 'color' in (data[0] as Record<string, unknown>);
}

export function isTableData(data: unknown): data is TableData {
  return typeof data === 'object' && data !== null && 'headers' in data && 'rows' in data;
}

export function parseVisuals(content: string): { text: string; visuals: VisualMetadata[] } {
  const visualRegex = /<!--VISUAL:(.*?)-->/g;
  const visuals: VisualMetadata[] = [];
  const text = content.replace(visualRegex, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.type && parsed.title && parsed.data) {
        visuals.push(parsed);
      }
    } catch { /* skip invalid */ }
    return '';
  });
  return { text: text.trim(), visuals };
}

'use client';

import { formatCurrency } from '@/lib/utils/format';
import type { TableData } from '@/lib/ai/visual-types';

export function ChatTable({ data, title }: { data: TableData; title: string }) {
  return (
    <div className="my-2 w-full max-w-md overflow-x-auto">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            {data.headers.map((header) => (
              <th key={header} className="px-2 py-1 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1">
                  {typeof cell === 'number' ? formatCurrency(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

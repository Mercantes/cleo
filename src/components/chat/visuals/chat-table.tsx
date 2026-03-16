'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { TableData } from '@/lib/ai/visual-types';

type SortDirection = 'asc' | 'desc' | null;

export function ChatTable({ data, title }: { data: TableData; title: string }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  function handleSort(colIndex: number) {
    if (sortCol === colIndex) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir(null); }
    } else {
      setSortCol(colIndex);
      setSortDir('asc');
    }
  }

  const sortedRows = useMemo(() => {
    if (sortCol === null || sortDir === null) return data.rows;
    return [...data.rows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDir === 'asc' ? -1 : 1;
      if (strA > strB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data.rows, sortCol, sortDir]);

  function SortIcon({ colIndex }: { colIndex: number }) {
    if (sortCol !== colIndex) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    if (sortDir === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />;
    return <ArrowDown className="ml-1 inline h-3 w-3" />;
  }

  return (
    <div className="my-2 w-full max-w-md overflow-x-auto">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            {data.headers.map((header, i) => (
              <th
                key={header}
                className="cursor-pointer select-none px-2 py-1 text-left font-medium transition-colors hover:text-foreground"
                onClick={() => handleSort(i)}
                aria-sort={sortCol === i ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {header}
                <SortIcon colIndex={i} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={`row-${i}-${row[0]}`} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={`${i}-${j}`} className="px-2 py-1">
                  {typeof cell === 'number' ? fmt(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

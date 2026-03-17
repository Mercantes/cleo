'use client';

import Link from 'next/link';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import type { CategoryData } from '@/types/dashboard';

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: 'bg-orange-500',
  Transporte: 'bg-red-500',
  Moradia: 'bg-amber-500',
  Saúde: 'bg-pink-500',
  Educação: 'bg-blue-500',
  Lazer: 'bg-purple-500',
  Serviços: 'bg-green-500',
  Transferências: 'bg-red-600',
  Supermercado: 'bg-lime-500',
  Restaurantes: 'bg-yellow-500',
  Seguros: 'bg-orange-400',
  Hospedagem: 'bg-amber-600',
  Telecomunicações: 'bg-cyan-500',
  'Serviços digitais': 'bg-violet-500',
  'Hospital/Labs': 'bg-rose-500',
};

function getCategoryBarColor(name: string, fallbackColor: string): string {
  return CATEGORY_COLORS[name] || `bg-[${fallbackColor}]`;
}

interface CategoriesTableCardProps {
  data: CategoryData[];
}

export function CategoriesTableCard({ data }: CategoriesTableCardProps) {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => hideValues ? HIDDEN_VALUE : formatCurrency(v);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  if (data.length === 0) return null;

  const totalAmount = data.reduce((s, d) => s + d.amount, 0);
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Principais Categorias</p>
        <Link href={`/transactions?type=debit&from=${monthStart}&to=${monthEnd}`} className="text-xs font-medium text-primary hover:underline">
          Ver mais ↗
        </Link>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {data.length} categoria{data.length !== 1 ? 's' : ''} · Total: {fmt(totalAmount)}
        {(() => {
          const rising = data.filter(c => c.change != null && c.change > 10).length;
          return rising > 0 ? ` · ${rising} em alta` : '';
        })()}
      </p>

      {/* Table header */}
      <div className="mt-4 hidden items-center gap-3 border-b pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:flex">
        <span className="w-40">Categoria</span>
        <span className="w-24 text-right">Atual</span>
        <span className="flex-1" />
        <span className="w-16 text-right">Variação</span>
        <span className="hidden w-24 text-right xl:block">Anterior</span>
      </div>

      <div className="mt-2 space-y-1.5 sm:mt-0 sm:space-y-0">
        {data.map((cat) => {
          const barWidth = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
          const barColorClass = CATEGORY_COLORS[cat.name] || '';
          const prevAmount = cat.change != null && cat.change !== 0
            ? cat.amount / (1 + cat.change / 100)
            : null;

          const href = cat.categoryId === null
            ? '/transactions?category=uncategorized'
            : cat.categoryId === '_others'
              ? '/transactions'
              : `/transactions?category=${encodeURIComponent(cat.categoryId)}`;

          return (
            <Link
              key={cat.name}
              href={href}
              className="flex items-center gap-3 rounded-md px-1 py-2 transition-colors hover:bg-accent/50 sm:py-2.5"
            >
              {/* Category icon + name */}
              <span className="flex w-40 shrink-0 items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${barColorClass}`}
                  style={!barColorClass ? { backgroundColor: cat.color } : undefined}
                />
                <span className="truncate text-sm">{cat.name}</span>
              </span>

              {/* Amount */}
              <span className="w-24 shrink-0 text-right">
                <span className="text-sm font-medium">{fmt(cat.amount)}</span>
                {totalAmount > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {Math.round((cat.amount / totalAmount) * 100)}%
                  </span>
                )}
              </span>

              {/* Progress bar */}
              <span className="hidden flex-1 sm:block">
                <span className="relative block h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <span
                    className={`block h-full rounded-full transition-all ${barColorClass || 'bg-primary'}`}
                    style={{
                      width: `${barWidth}%`,
                      ...(!barColorClass ? { backgroundColor: cat.color } : {}),
                    }}
                  />
                </span>
              </span>

              {/* Change % */}
              <span className="w-16 shrink-0 text-right">
                {cat.change != null && cat.change !== 0 ? (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    cat.change > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {cat.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {cat.change > 0 ? '+' : ''}{cat.change}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </span>

              {/* Previous month amount */}
              <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground xl:block">
                {prevAmount != null ? fmt(prevAmount) : '—'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

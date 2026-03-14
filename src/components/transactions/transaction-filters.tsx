'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Search, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

interface TransactionFiltersProps {
  onFiltersChange: (filters: {
    search?: string;
    from?: string;
    to?: string;
    type?: string;
    category?: string;
  }) => void;
}

export function TransactionFilters({ onFiltersChange }: TransactionFiltersProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const initialCategoryApplied = useRef(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        const cats = data.categories || [];
        setCategories(cats);
        // Apply category from URL query param
        if (!initialCategoryApplied.current) {
          initialCategoryApplied.current = true;
          const categoryParam = searchParams.get('category');
          if (categoryParam === 'uncategorized') {
            setCategory('uncategorized');
          } else if (categoryParam) {
            // Try matching by ID first, then by name
            const matchById = cats.find((c: { id: string; name: string }) => c.id === categoryParam);
            const matchByName = !matchById && cats.find((c: { id: string; name: string }) =>
              c.name.toLowerCase() === categoryParam.toLowerCase()
            );
            const match = matchById || matchByName;
            if (match) setCategory(match.id);
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = search || dateRange?.from || dateRange?.to || type || category;
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

  const datePresets = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstOfLastMonth = new Date(year, month - 1, 1);
    const lastOfLastMonth = new Date(year, month, 0);
    const last7 = new Date(now); last7.setDate(now.getDate() - 6);
    const last30 = new Date(now); last30.setDate(now.getDate() - 29);

    return [
      { id: 'this_month', label: 'Este mês', from: firstOfMonth, to: lastOfMonth },
      { id: 'last_month', label: 'Mês passado', from: firstOfLastMonth, to: lastOfLastMonth },
      { id: 'last_7', label: '7 dias', from: last7, to: now },
      { id: 'last_30', label: '30 dias', from: last30, to: now },
    ];
  }, []);

  function applyPreset(presetId: string) {
    if (activePreset === presetId) {
      setActivePreset(null);
      setDateRange(undefined);
      return;
    }
    const preset = datePresets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setDateRange({ from: preset.from, to: preset.to });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        from: dateRange?.from ? fmtDate(dateRange.from) : undefined,
        to: dateRange?.to ? fmtDate(dateRange.to) : undefined,
        type: type || undefined,
        category: category || undefined,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, dateRange, type, category, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDateRange(undefined);
    setType('');
    setCategory('');
    setActivePreset(null);
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição ou estabelecimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar transações"
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        {datePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset.id)}
            aria-label={`Filtrar: ${preset.label}`}
            aria-pressed={activePreset === preset.id}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              activePreset === preset.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filtrar por tipo"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">Todos os tipos</option>
          <option value="credit">Receitas</option>
          <option value="debit">Despesas</option>
        </select>
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoria"
            className="h-9 max-w-[180px] rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">Todas as categorias</option>
            <option value="uncategorized">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
        <DateRangePicker
          value={dateRange}
          onChange={(range) => { setDateRange(range); setActivePreset(null); }}
        />
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

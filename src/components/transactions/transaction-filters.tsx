'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const hasFilters = search || from || to || type || category;

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        type: type || undefined,
        category: category || undefined,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, from, to, type, category, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFrom('');
    setTo('');
    setType('');
    setCategory('');
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
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="min-w-[140px] sm:w-auto"
          aria-label="Data inicial"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="min-w-[140px] sm:w-auto"
          aria-label="Data final"
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

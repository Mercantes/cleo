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
  }) => void;
}

export function TransactionFilters({ onFiltersChange }: TransactionFiltersProps) {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const hasFilters = search || from || to;

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({ search: search || undefined, from: from || undefined, to: to || undefined });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, from, to, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFrom('');
    setTo('');
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-auto"
          aria-label="Data inicial"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-auto"
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

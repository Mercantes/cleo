'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronDown, Check, Loader2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatRelativeDate } from '@/lib/utils/format';
import { HighlightText } from '@/components/ui/highlight-text';

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
}

interface TransactionItemProps {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'debit' | 'credit';
  category?: {
    name: string;
    icon: string;
  } | null;
  categoryId?: string | null;
  merchant?: string | null;
  searchQuery?: string;
  onCategoryChange?: (id: string, categoryId: string, category: { name: string; icon: string }) => void;
}

let categoriesCache: CategoryOption[] | null = null;

function loadCategories(): Promise<CategoryOption[]> {
  if (categoriesCache) return Promise.resolve(categoriesCache);
  return fetch('/api/categories')
    .then((r) => r.json())
    .then((data) => {
      const cats: CategoryOption[] = data.categories || [];
      categoriesCache = cats;
      return cats;
    });
}

export function TransactionItem({
  id,
  description,
  amount,
  date,
  type,
  category,
  categoryId,
  merchant,
  searchQuery,
  onCategoryChange,
}: TransactionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>(categoriesCache || []);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [swipeOpen, setSwipeOpen] = useState(false);
  const displayAmount = type === 'credit' ? amount : -amount;
  const isIncome = type === 'credit';
  const hasMerchantDetail = merchant && merchant !== description;

  const rowRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  useEffect(() => {
    if (expanded && categories.length === 0 && !categoriesCache) {
      loadCategories().then(setCategories).catch(() => {});
    } else if (expanded && categoriesCache && categories.length === 0) {
      setCategories(categoriesCache);
    }
  }, [expanded, categories.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.touches[0].clientX;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 10 && dy < 30) swiping.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swiping.current) {
      setSwipeOpen(true);
      if (categories.length === 0) {
        loadCategories().then(setCategories).catch(() => {});
      }
    }
  }, [categories.length]);

  async function handleCategoryChange(newCategoryId: string) {
    if (newCategoryId === selectedCategoryId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: newCategoryId }),
      });
      if (res.ok) {
        setSelectedCategoryId(newCategoryId);
        const cat = categories.find((c) => c.id === newCategoryId);
        if (cat && onCategoryChange) {
          onCategoryChange(id, newCategoryId, { name: cat.name, icon: cat.icon });
        }
        setSwipeOpen(false);
      }
    } catch {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      ref={rowRef}
      className="relative overflow-hidden rounded-lg border transition-colors hover:bg-accent/30"
    >
      {/* Swipe action panel (mobile) */}
      {swipeOpen && (
        <div className="border-b bg-muted/50 px-3 py-2 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Tags className="h-3.5 w-3.5" />
              <span>Categoria</span>
            </div>
            <button
              onClick={() => setSwipeOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar
            </button>
          </div>
          <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
            {categories.length === 0 ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : (
              categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    disabled={isSaving}
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-muted bg-background hover:border-primary/50',
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    {isSelected && !isSaving && <Check className="h-3 w-3" />}
                    {isSelected && isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex w-full items-center justify-between gap-3 p-3 text-left md:p-4"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" role="img" aria-label={category?.name || 'Sem categoria'}>
            {category?.icon || '📦'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              <HighlightText text={merchant || description} query={searchQuery || ''} />
            </p>
            <p className="text-xs text-muted-foreground">
              {category?.name || 'Sem categoria'} · {formatRelativeDate(date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'shrink-0 text-sm font-semibold',
              isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
            )}
          >
            {isIncome ? '+' : ''}{formatCurrency(displayAmount)}
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground md:px-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium text-foreground">Descrição</span>
              <p>{description}</p>
            </div>
            {hasMerchantDetail && (
              <div>
                <span className="font-medium text-foreground">Estabelecimento</span>
                <p>{merchant}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Data</span>
              <p>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Tipo</span>
              <p>{isIncome ? 'Receita' : 'Despesa'}</p>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="mt-3 border-t pt-2">
              <span className="font-medium text-foreground">Categoria</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      disabled={isSaving}
                      className={cn(
                        'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-muted hover:border-primary/50 hover:bg-accent',
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      {isSelected && !isSaving && <Check className="h-3 w-3" />}
                      {isSelected && isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

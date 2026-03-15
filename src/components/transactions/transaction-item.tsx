'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MoreVertical, Tags, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDateTime, formatRelativeDate } from '@/lib/utils/format';
import { HighlightText } from '@/components/ui/highlight-text';

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
}

interface AccountInfo {
  id: string;
  name: string;
  type: string;
  bank_connections: {
    connector_name: string;
    connector_logo_url: string | null;
  } | null;
}

interface TransactionRowProps {
  index: number;
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
  account?: AccountInfo | null;
  searchQuery?: string;
  mobile?: boolean;
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

function CategoryBadge({ category }: { category: { name: string; icon: string } | null | undefined }) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        📦 Sem categoria
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {category.icon} {category.name}
    </span>
  );
}

function AccountBadge({ account }: { account: AccountInfo | null | undefined }) {
  if (!account) return <span className="text-xs text-muted-foreground">—</span>;

  const conn = account.bank_connections as { connector_name: string; connector_logo_url: string | null } | null;
  const logoUrl = conn?.connector_logo_url;

  return (
    <div className="flex items-center gap-1.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={conn?.connector_name || ''} className="h-5 w-5 rounded-full object-contain" />
      ) : (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {(conn?.connector_name || account.name || '?').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function TransactionRow({
  index,
  id,
  description,
  amount,
  date,
  type,
  category,
  categoryId,
  merchant,
  account,
  searchQuery,
  mobile,
  onCategoryChange,
}: TransactionRowProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>(categoriesCache || []);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const displayAmount = type === 'credit' ? amount : -amount;
  const isIncome = type === 'credit';
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showCategories && categories.length === 0) {
      loadCategories().then(setCategories).catch(() => {});
    }
  }, [showCategories, categories.length]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleCategoryChange = useCallback(async (newCategoryId: string) => {
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
        setShowCategories(false);
      }
    } catch {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  }, [id, selectedCategoryId, isSaving, categories, onCategoryChange]);

  // Mobile card layout
  if (mobile) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 p-3">
          <span className="w-6 text-center text-xs text-muted-foreground">{index}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              <HighlightText text={merchant || description} query={searchQuery || ''} />
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={category} />
              <span className="text-xs text-muted-foreground">{formatRelativeDate(date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AccountBadge account={account} />
            <span
              className={cn(
                'shrink-0 text-sm font-semibold',
                isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
              )}
            >
              {formatCurrency(Math.abs(displayAmount))}
            </span>
          </div>
        </div>

        {showCategories && (
          <div className="border-t px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              {categories.length === 0 ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Carregando...
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
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop table row
  return (
    <>
      <div className="group grid grid-cols-[2.5rem_1fr_10rem_8rem_10rem_7rem_2.5rem] items-center gap-2 border-b px-4 py-2.5 text-sm transition-colors last:border-0 hover:bg-accent/30">
        {/* Number */}
        <span className="text-center text-xs text-muted-foreground">{index}</span>

        {/* Description */}
        <div className="min-w-0">
          <p className="truncate font-medium">
            <HighlightText text={merchant || description} query={searchQuery || ''} />
          </p>
          {merchant && merchant !== description && (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <CategoryBadge category={category} />
        </div>

        {/* Account */}
        <div className="flex justify-center">
          <AccountBadge account={account} />
        </div>

        {/* Date */}
        <span className="text-xs text-muted-foreground">{formatDateTime(date)}</span>

        {/* Amount */}
        <span
          className={cn(
            'text-right text-sm font-semibold',
            isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
          )}
        >
          {formatCurrency(Math.abs(displayAmount))}
        </span>

        {/* Action menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
            aria-label="Ações da transação"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border bg-popover p-1 shadow-lg">
              <button
                onClick={() => {
                  setShowCategories(!showCategories);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Tags className="h-4 w-4" />
                Alterar categoria
              </button>
              {!isIncome && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      description: merchant || description,
                      amount: String(Math.abs(amount)),
                      txId: id,
                    });
                    router.push(`/splits?${params.toString()}`);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Users className="h-4 w-4" />
                  Dividir conta
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category selector (expanded below row) */}
      {showCategories && (
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.length === 0 ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Carregando categorias...
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
                      'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-muted bg-background hover:border-primary/50 hover:bg-accent',
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
    </>
  );
}

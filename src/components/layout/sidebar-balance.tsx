'use client';

import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface AccountsData {
  totalBalance: number;
}

export function SidebarBalance() {
  const { data } = useApi<AccountsData>('/api/dashboard/accounts');

  if (!data || data.totalBalance === undefined) return null;

  return (
    <div className="border-t px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Patrimônio
      </p>
      <p
        className={cn(
          'mt-0.5 text-sm font-bold',
          data.totalBalance >= 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-500 dark:text-red-400',
        )}
      >
        {formatCurrency(data.totalBalance)}
      </p>
    </div>
  );
}

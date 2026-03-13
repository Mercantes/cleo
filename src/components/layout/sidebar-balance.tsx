'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

interface BalanceData {
  totalBalance: number;
}

export function SidebarBalance() {
  const pathname = usePathname();
  const [data, setData] = useState<BalanceData | null>(null);

  useEffect(() => {
    fetchWithTimeout('/api/dashboard/accounts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.totalBalance !== undefined) setData({ totalBalance: d.totalBalance });
      })
      .catch(() => {});
  }, [pathname]);

  if (!data) return null;

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

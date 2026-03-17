'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { mutate } from 'swr';

const PREFETCH_MAP: Record<string, string[]> = {
  '/dashboard': [
    '/api/dashboard/accounts',
    '/api/dashboard/recent',
    '/api/goals',
    '/api/insights',
  ],
  '/transactions': [
    '/api/categories',
  ],
  '/settings': [
    '/api/goals',
  ],
  '/splits': [
    '/api/splits',
  ],
  '/budgets': [
    '/api/budgets',
    '/api/categories',
  ],
  '/challenges': [
    '/api/challenges',
    '/api/goals',
  ],
  '/reports': [
    '/api/reports/monthly',
  ],
  '/cashflow': [
    '/api/recurring',
    '/api/dashboard/accounts',
  ],
  '/accounts': [
    '/api/accounts',
  ],
  '/categories': [
    '/api/categories',
  ],
};

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null);

export function RoutePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    // Prefetch data for likely next pages based on current page
    const timer = setTimeout(() => {
      let urlsToPrefetch: string[] = [];

      if (pathname === '/dashboard') {
        urlsToPrefetch = [...(PREFETCH_MAP['/transactions'] || []), ...(PREFETCH_MAP['/reports'] || [])];
      } else if (pathname === '/transactions') {
        urlsToPrefetch = PREFETCH_MAP['/dashboard'] || [];
      } else if (pathname === '/reports') {
        urlsToPrefetch = PREFETCH_MAP['/dashboard'] || [];
      }

      // Warm SWR cache with prefetched data
      for (const url of urlsToPrefetch) {
        mutate(url, fetcher(url), { revalidate: false });
      }
    }, 2000); // Delay prefetch to not compete with current page load

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

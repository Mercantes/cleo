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
};

const fetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null);

export function RoutePrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    // Prefetch data for likely next pages based on current page
    const timer = setTimeout(() => {
      let urlsToPrefetch: string[] = [];

      if (pathname === '/dashboard') {
        // User on dashboard likely to visit transactions or settings
        urlsToPrefetch = PREFETCH_MAP['/transactions'] || [];
      } else if (pathname === '/transactions') {
        // User on transactions likely to return to dashboard
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

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const shortcuts: Record<string, string> = {
  d: '/dashboard',
  c: '/chat',
  t: '/transactions',
  p: '/projections',
  s: '/settings',
};

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger with Cmd/Ctrl + key
      if (!(e.metaKey || e.ctrlKey)) return;
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const route = shortcuts[e.key.toLowerCase()];
      if (route) {
        e.preventDefault();
        router.push(route);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}

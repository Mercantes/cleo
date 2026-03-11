'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

let showToastFn: ((message: string) => void) | null = null;

export function toast(message: string) {
  showToastFn?.(message);
}

export function Toaster() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    showToastFn = (message: string) => {
      setText(message);
      setVisible(true);
    };
    return () => {
      showToastFn = null;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg transition-all duration-300 md:bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      {text}
    </div>
  );
}

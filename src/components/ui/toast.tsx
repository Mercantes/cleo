'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

let showToastFn: ((message: string, variant?: ToastVariant) => void) | null = null;

export function toast(message: string, variant?: ToastVariant) {
  showToastFn?.(message, variant);
}

toast.success = (message: string) => toast(message, 'success');
toast.error = (message: string) => toast(message, 'error');
toast.warning = (message: string) => toast(message, 'warning');

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'bg-foreground text-background',
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
};

export function Toaster() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ToastState>({ message: '', variant: 'default' });

  useEffect(() => {
    showToastFn = (message: string, variant: ToastVariant = 'default') => {
      setState({ message, variant });
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
        'fixed bottom-[5.5rem] left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-2 text-sm shadow-lg transition-all duration-300 md:bottom-6',
        VARIANT_STYLES[state.variant],
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      {state.message}
    </div>
  );
}

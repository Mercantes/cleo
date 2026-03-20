'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const refreshing = useRef(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if ((window.scrollY ?? 0) > 0 || refreshing.current) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff < 0) {
      pulling.current = false;
      return;
    }

    const progress = Math.min(diff / threshold, 1);
    if (indicatorRef.current) {
      indicatorRef.current.style.transform = `translateY(${Math.min(diff * 0.5, threshold * 0.6)}px)`;
      indicatorRef.current.style.opacity = String(progress);
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    const indicator = indicatorRef.current;
    if (!indicator) return;

    const match = indicator.style.transform.match(/translateY\(([^)]+)px\)/);
    const currentY = match ? parseFloat(match[1]) : 0;

    if (currentY >= threshold * 0.5) {
      refreshing.current = true;
      indicator.classList.add('animate-spin');
      try {
        await onRefresh();
      } finally {
        refreshing.current = false;
        indicator.classList.remove('animate-spin');
      }
    }

    indicator.style.transform = 'translateY(0)';
    indicator.style.opacity = '0';
  }, [onRefresh, threshold]);

  useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { indicatorRef };
}

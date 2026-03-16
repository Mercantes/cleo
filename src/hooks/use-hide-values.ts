'use client';

import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'cleo-hide-values';
const EVENT_NAME = 'hide-values-toggle';

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useHideValues(): [boolean, () => void] {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = localStorage.getItem(STORAGE_KEY) !== 'true';
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return [hidden, toggle];
}

export const HIDDEN_VALUE = 'R$ •••••';

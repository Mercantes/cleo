'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isDismissedOrInstalled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    return sessionStorage.getItem('pwa-prompt-dismissed') === '1';
  } catch {
    return true;
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (isDismissedOrInstalled()) {
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm rounded-xl border bg-background p-4 shadow-lg md:bottom-4 md:left-auto md:right-4">
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Instalar Cleo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Acesse suas finanças direto da tela inicial.
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Instalar app
          </button>
        </div>
      </div>
    </div>
  );
}

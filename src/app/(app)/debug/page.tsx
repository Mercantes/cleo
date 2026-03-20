'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [info, setInfo] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const lines: string[] = [];
    lines.push(`userAgent: ${navigator.userAgent}`);
    lines.push(`platform: ${navigator.platform}`);
    lines.push(`online: ${navigator.onLine}`);
    lines.push(`cookieEnabled: ${navigator.cookieEnabled}`);
    lines.push(`url: ${window.location.href}`);
    lines.push(`timestamp: ${new Date().toISOString()}`);

    // Test localStorage
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      lines.push('localStorage: OK');
    } catch (e) {
      lines.push(`localStorage: FAIL - ${e}`);
    }

    // Test sessionStorage
    try {
      sessionStorage.setItem('__test__', '1');
      sessionStorage.removeItem('__test__');
      lines.push('sessionStorage: OK');
    } catch (e) {
      lines.push(`sessionStorage: FAIL - ${e}`);
    }

    // Test Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setInfo((prev) => [...prev, `SW: ${reg ? `active (scope: ${reg.scope})` : 'not registered'}`]);
      });
    } else {
      lines.push('SW: not supported');
    }

    setInfo(lines);

    // Global error handler
    const handler = (e: ErrorEvent) => {
      setErrors((prev) => [...prev, `[error] ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`]);
    };
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      setErrors((prev) => [...prev, `[rejection] ${e.reason}`]);
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 12 }}>
      <h1 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Debug Info</h1>
      <div style={{ background: '#1a1a2e', color: '#0f0', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        {info.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {errors.length > 0 && (
        <div style={{ background: '#2e1a1a', color: '#f55', padding: 12, borderRadius: 8 }}>
          <strong>Errors:</strong>
          {errors.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
      {errors.length === 0 && (
        <div style={{ background: '#1a2e1a', color: '#0f0', padding: 12, borderRadius: 8 }}>
          No errors detected. This page loaded successfully.
        </div>
      )}
    </div>
  );
}

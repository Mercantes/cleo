import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Sample 100% of sessions with errors
  replaysOnErrorSampleRate: 1.0,
  // Sample 5% of all sessions
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Don't send errors in development
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') return null;
    return event;
  },
});

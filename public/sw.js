/// <reference lib="webworker" />

const CACHE_NAME = 'cleo-v3';
const API_CACHE_NAME = 'cleo-api-v1';
const OFFLINE_URLS = ['/', '/dashboard', '/transactions', '/splits', '/reports', '/import'];
const API_CACHE_URLS = [
  '/api/dashboard/summary',
  '/api/dashboard/categories',
  '/api/dashboard/trends',
  '/api/dashboard/accounts',
  '/api/dashboard/recent',
  '/api/goals',
  '/api/insights',
  '/api/reports/monthly',
  '/api/reports/compare',
  '/api/splits',
];
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .catch((err) => {
        console.warn('[sw] Cache install failed (quota?):', err.message);
      }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Stale-while-revalidate for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache GET requests to our API endpoints
  if (event.request.method !== 'GET') return;

  const isApiRequest = API_CACHE_URLS.some((path) => url.pathname.startsWith(path));
  if (!isApiRequest) return;

  event.respondWith(
    caches.open(API_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      // Check if cache is fresh enough
      if (cached) {
        const cachedDate = cached.headers.get('sw-cached-at');
        const isFresh = cachedDate && Date.now() - Number(cachedDate) < API_CACHE_MAX_AGE;

        if (isFresh) {
          // Still revalidate in background
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                const headers = new Headers(clone.headers);
                headers.set('sw-cached-at', String(Date.now()));
                clone.blob().then((body) => {
                  cache.put(
                    event.request,
                    new Response(body, { status: clone.status, headers }),
                  ).catch(() => {});
                });
              }
            })
            .catch(() => {});

          return cached;
        }
      }

      // Fetch from network, cache result
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const clone = response.clone();
          const headers = new Headers(clone.headers);
          headers.set('sw-cached-at', String(Date.now()));
          clone.blob().then((body) => {
            cache.put(
              event.request,
              new Response(body, { status: clone.status, headers }),
            ).catch(() => {});
          });
        }
        return response;
      } catch {
        // Offline — return stale cache if available
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }),
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Cleo';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'cleo-notification',
    data: { url: data.url || '/dashboard' },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

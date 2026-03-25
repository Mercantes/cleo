/// <reference lib="webworker" />

const CACHE_NAME = 'cleo-v6';
const API_CACHE_NAME = 'cleo-api-v3';
const API_CACHE_URLS = [
  '/api/dashboard/summary',
  '/api/dashboard/categories',
  '/api/dashboard/trends',
  '/api/dashboard/accounts',
  '/api/dashboard/recent',
  '/api/goals',
  '/api/reports/monthly',
  '/api/reports/compare',
  '/api/splits',
];
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  // Pre-cache only the offline fallback page (lightweight, static HTML).
  // Do NOT pre-cache app HTML — it causes stale JS chunk references after deploys.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/offline.html')),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear ALL old caches on activation (forces fresh content after deploy)
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first with offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    );
    return;
  }

  // Skip non-API requests (let browser handle static assets normally)
  const isApiRequest = API_CACHE_URLS.some((path) => url.pathname.startsWith(path));
  if (!isApiRequest) return;

  // API requests: stale-while-revalidate
  event.respondWith(
    caches.open(API_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      if (cached) {
        const cachedDate = cached.headers.get('sw-cached-at');
        const isFresh = cachedDate && Date.now() - Number(cachedDate) < API_CACHE_MAX_AGE;

        if (isFresh) {
          // Revalidate in background
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

      // Fetch from network
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

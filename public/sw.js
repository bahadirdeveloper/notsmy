// Bump this when sw logic changes so old caches get cleaned up.
const CACHE_NAME = 'notsmy-v2';
// Only precache truly static, auth-independent assets.
// Pages like /, /login, /landing depend on session and must NOT be precached.
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/pages, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API routes: network only
  if (url.pathname.startsWith('/api/')) return;

  // Static assets: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|css|js)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Pages (HTML / RSC): network-only. Caching auth-dependent HTML can leak
  // another user's view or show stale "logged out" pages after sign in.
  // Falling back to cached HTML on offline is acceptable only if we strip
  // auth-sensitive routes — for now keep it simple and let the browser handle
  // its own offline error.
});

// Push notification support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notsmy';
  const options = {
    body: data.body || 'Yeni bildiriminiz var',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: data.tag || 'notsmy-notification',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

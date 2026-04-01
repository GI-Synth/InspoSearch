/* InspoSearch Service Worker — static asset cache + stale-while-revalidate */
/* Cache version — update on each deploy (build script or manual) */
const CACHE_VERSION = '20260401b';
const CACHE_NAME = 'inspo-' + CACHE_VERSION;
const STATIC_ASSETS = [
  './',
  './index.html',
  './institutions.html',
  './style.css',
  './app.js',
  './sources.manifest.json',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only cache same-origin static resources and GET requests
  if (event.request.method !== 'GET') return;

  // Navigation requests (PWA launch, page reload) — serve cached shell, update in background
  if (event.request.mode === 'navigate') {
    const pathname = url.pathname;
    const isRoot = pathname === '/' || pathname.endsWith('/index.html');
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        // Try exact match first; only fall back to index.html for root navigations
        let cached = await cache.match(event.request);
        if (!cached && isRoot) {
          cached = await cache.match('./') || await cache.match('./index.html');
        }

        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            cache.put(event.request, response.clone());
            if (isRoot) cache.put('./', response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // For API calls (external), use network-first strategy
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For static assets, use stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});

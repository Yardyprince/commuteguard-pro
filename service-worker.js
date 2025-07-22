/*
 * Simple service worker for CommuteGuard Pro.
 * It caches core assets on install and serves them from the cache if
 * available, falling back to the network otherwise. This makes the
 * application available offline and improves load times on repeat visits.
 */

const CACHE_NAME = 'commuteguard-cache-v1';
// List of assets to cache. Paths are relative to the scope of the service worker.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './service-worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Perform install steps: pre-cache assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response from cache. Otherwise fetch from network.
      return response || fetch(event.request);
    })
  );
});

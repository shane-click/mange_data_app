// service-worker.js

const CACHE_NAME = 'wombat-cache-v1';
const ASSETS_TO_CACHE = [
  './',              // this might cache index.html depending on your server
  './index.html',
  './manifest.json',
  './service-worker.js',
  // Add any external scripts or CSS you have, for example:
  // './styles.css',
  // './app.js',
  // './icons/icon-192.png',
  // './icons/icon-512.png',
];

// Install event: Cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: Cleanup old caches if needed
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found, else fetch from network
      return cachedResponse || fetch(event.request);
    })
  );
});

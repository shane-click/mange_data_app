/* service-worker.js  –  caches every asset needed for offline use */
const CACHE = 'mange-cache-v1';

const ASSETS = [
  '/mange_data_app/',                       // root → index.html
  '/mange_data_app/index.html',
  '/mange_data_app/manifest.json',
  '/mange_data_app/service-worker.js',
  '/mange_data_app/icons/icon-192.png',
  '/mange_data_app/icons/icon-512.png'
  // add other files here if you create extra CSS/JS/images
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

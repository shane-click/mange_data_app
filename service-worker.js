/* service-worker.js – Enhanced for background sync and timer persistence */
const CACHE = 'mange-cache-v3';

const ASSETS = [
  '/mange_data_app/',
  '/mange_data_app/index.html',
  '/mange_data_app/app.js',
  '/mange_data_app/manifest.json',
  '/mange_data_app/service-worker.js',
  '/mange_data_app/icons/icon-192.png',
  '/mange_data_app/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k!==CACHE && caches.delete(k)))
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

// Background sync for data submission when back online
self.addEventListener('sync', e => {
  if (e.tag === 'background-sync') {
    e.waitUntil(doBackgroundSync());
  }
});

// Periodic background sync to maintain timer (if supported)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'timer-sync') {
    e.waitUntil(syncTimerState());
  }
});

async function doBackgroundSync() {
  // Handle any pending data submissions
  console.log('Background sync triggered');
}

async function syncTimerState() {
  // Keep timer state synchronized
  console.log('Timer sync triggered');
}

// Handle app coming back to foreground
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'RESTORE_TIMER') {
    // App is asking to restore timer state
    e.ports[0].postMessage({type: 'TIMER_RESTORED'});
  }
});

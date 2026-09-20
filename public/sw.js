// Bump this whenever the shell or asset strategy changes. Old caches are
// deleted during activation so users cannot remain on an earlier UI version.
const CACHE_NAME = 'ims-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/register.html',
  '/favicon.svg',
  '/icons.svg',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force active service worker to take control
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip browser extensions or cross-origin external API requests if any
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    // Prefer the network so a freshly deployed bundle is immediately visible
    // on every origin/port. Cache is only the offline fallback.
    fetch(event.request).then((networkResponse) => {
      if (networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') return caches.match('/index.html');
        throw new Error('Network unavailable and no cached response exists');
      });
    })
  );
});

// LutealShield PWA Service Worker
const CACHE_NAME = 'lutealshield-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/onboarding.html',
  '/plan.html',
  '/pocket.html',
  '/bloomy.html',
  '/support.html',
  '/settings.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon.svg',
  '/bloomy.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Some assets could not be cached immediately:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // If calling Bloomy API and offline, provide a graceful offline JSON response
  if (url.pathname === '/api/bloomy' && request.method === 'POST') {
    event.respondWith(
      fetch(request.clone()).catch(() => {
        return new Response(
          JSON.stringify({
            response: "Bloomy is resting 💜 Look through your Affirmations Pocket while you wait.",
            offline: true
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          }
        );
      })
    );
    return;
  }

  // Cache-first / Network fallback for navigation and static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

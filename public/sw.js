// Service Worker pro PWA funkcionalitu
const CACHE_NAME = 'wedding-app-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instaluji...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cachování souborů');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Chyba při cachování:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Aktivuji...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Mažu starý cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pouze GET požadavky
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Používám cache pro:', event.request.url);
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Kontrola platné odpovědi
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Klon odpovědi pro cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch error:', error);
            // Vrátit offline stránku nebo základní odpověď
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
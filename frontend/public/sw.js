const STATIC_CACHE = 'saarthi-static-v1';
const RUNTIME_CACHE = 'saarthi-runtime-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/onboarding', '/next.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }),
      ),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        void caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, responseToCache));
        return response;
      });
    }),
  );
});

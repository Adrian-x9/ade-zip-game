// FIX: wersja cache musi się zmienić przy każdym deploymencie
// żeby stary SW nie serwował przeterminowanych plików
const CACHE_NAME = 'zip-game-cache-v1.2.0';

// Pliki do pre-cache przy instalacji (statyczne, znane z góry)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
  // Uwaga: haszowane pliki JS/CSS (np. assets/index-Bxyz.js) są cachowane
  // dynamicznie przy pierwszym pobraniu – patrz strategia fetch poniżej.
  // Właściwe rozwiązanie długoterminowe: vite-plugin-pwa (automatyczny precache manifest).
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FIX: cache-as-you-go – wszystkie GET cachujemy przy pierwszym pobraniu.
// Dzięki temu haszowane pliki Vite (assets/index-Xyz.js, assets/style-Abc.css)
// trafiają do cache przy pierwszej wizycie i są dostępne offline od razu.
self.addEventListener('fetch', (event) => {
  // Ignorujemy non-GET i żądania do zewnętrznych domen (np. analytics)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cachujemy tylko poprawne odpowiedzi same-origin (type: 'basic')
        // Opaque responses (CDN, cross-origin) pomijamy – nieznany status
        if (response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

const CACHE = 'finanalytica-v1';

const PRECACHE = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
];

// Instalar: pre-cachear recursos clave
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets estáticos, network-first para API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Dejar pasar las llamadas a la API de Anthropic (requieren red)
  if (url.hostname === 'api.anthropic.com') return;

  // Cache-first para todo lo demás
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Solo cachear respuestas válidas de GET
        if (e.request.method !== 'GET' || !response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});

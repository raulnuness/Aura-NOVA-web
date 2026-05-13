const CACHE_NAME = 'auranova-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/products.js',
  '/js/cart.js',
  '/js/checkout.js',
  '/js/app.js',
  '/img/favicon.svg',
  '/img/favicon-32.png',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/pages/contacto.html',
  '/pages/privacidade.html',
  '/pages/termos.html',
  '/pages/envios-devolucoes.html',
  '/pages/rastrear.html'
];

// Instalar — cache estático
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Algumas páginas podem não existir localmente, ignorar
      });
    })
  );
  self.skipWaiting();
});

// Ativar — limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar pedidos à API
  if (request.url.includes('/api/')) return;

  // Imagens — cache first
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Navegação e outros — network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
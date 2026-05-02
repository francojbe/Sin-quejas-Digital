// Service Worker simplificado para evitar conflictos con OneSignal y Next.js HMR

const CACHE_NAME = 'sin-quejas-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

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

// Solo manejamos fetch si es estrictamente necesario, 
// para evitar errores de "Failed to convert value to Response"
self.addEventListener('fetch', (event) => {
  // Dejamos que las peticiones pasen de largo por defecto
  return;
});

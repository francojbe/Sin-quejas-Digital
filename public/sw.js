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

// Manejador de mensajes para satisfacer requisitos de navegadores (como Safari)
// Debe registrarse en la evaluación inicial del script
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Solo manejamos fetch si es estrictamente necesario
self.addEventListener('fetch', (event) => {
  // Dejamos que las peticiones pasen de largo con una respuesta por defecto
  // o simplemente no llamamos a event.respondWith() para que siga el curso normal
});

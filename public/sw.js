// Service Worker — Sin Quejas Digital v4
// Estrategia: App Shell + Image Cache + Navigation Fallback
// OneSignal y Supabase NUNCA se cachean.

const CACHE_SHELL = 'sqd-shell-v4';
const CACHE_IMAGES = 'sqd-images-v4';
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// App Shell: páginas y assets críticos pre-cacheados en install
const SHELL_URLS = [
  '/',
  '/login',
  '/offline.html',
];

// ── INSTALL: pre-cachear App Shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  // NO llamamos skipWaiting() aquí.
  // Si lo hacemos, el nuevo SW se activa inmediatamente, llama clients.claim()
  // y eso dispara visibilitychange en todas las pestañas → bucle de refresh.
  // El nuevo SW esperará a que no haya pestañas abiertas, o hasta que
  // SWRegistration.tsx envíe el mensaje SKIP_WAITING.
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      return cache.addAll(SHELL_URLS).catch((err) => {
        // No bloquear install si alguna URL falla (p.ej. /login en build export)
        console.warn('[SW] Error pre-cacheando shell:', err);
      });
    })
  );
});

// ── ACTIVATE: limpiar cachés viejas ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_IMAGES)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── MESSAGE: soporte para skipWaiting externo ────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── FETCH: enrutar por estrategia ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Solo manejar GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Ignorar OneSignal (sus workers gestionan su propio ciclo de vida)
  if (
    url.hostname.includes('onesignal.com') ||
    url.pathname.includes('OneSignalSDK')
  ) return;

  // 2. Ignorar Supabase: siempre tiempo real, nunca cachear
  if (url.hostname.includes('supabase.co')) return;

  // 3. Ignorar Next.js HMR (desarrollo local)
  if (url.pathname.includes('_next/webpack-hmr')) return;

  // 4. Imágenes de cartas y logros → Cache-First con TTL
  if (
    url.pathname.startsWith('/cartas/') ||
    url.pathname.startsWith('/logros/')
  ) {
    event.respondWith(cacheFirstWithTTL(event.request, CACHE_IMAGES, IMAGE_TTL_MS));
    return;
  }

  // 5. Assets estáticos de Next.js (_next/static/) → Cache-First permanente
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event.request, CACHE_SHELL));
    return;
  }

  // 6. Navegación de páginas → Network-First con fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(event.request));
    return;
  }

  // 7. Todo lo demás: dejar pasar sin interceptar
});

// ── ESTRATEGIAS ──────────────────────────────────────────────────────────────

/**
 * Cache-First: sirve desde caché si existe, si no busca en red y guarda.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Cache-First con TTL: como cacheFirst pero invalida la entrada tras X ms.
 * Almacena el timestamp en el header personalizado 'sw-cached-at'.
 */
async function cacheFirstWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedAt = cached.headers.get('sw-cached-at');
    if (cachedAt && Date.now() - parseInt(cachedAt) < ttl) {
      return cached;
    }
  }

  // Caché expirada o ausente: ir a la red
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clonar y añadir header de timestamp
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const cachedResponse = new Response(await networkResponse.blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      cache.put(request, cachedResponse.clone());
      return cachedResponse;
    }
    return networkResponse;
  } catch {
    // Sin red: servir desde caché aunque esté expirada
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-First: intenta la red, guarda en caché, y si falla sirve desde caché.
 * Como último recurso sirve /offline.html.
 */
async function networkFirstWithFallback(request) {
  const cache = await caches.open(CACHE_SHELL);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Último recurso: página offline
    const offlinePage = await cache.match('/offline.html');
    return offlinePage || new Response('<h1>Sin conexión</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

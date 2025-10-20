// Service Worker para Ravehub - Progressive Web App
const CACHE_NAME = 'ravehub-v1.0.0';
const STATIC_CACHE = 'ravehub-static-v1.0.0';
const DYNAMIC_CACHE = 'ravehub-dynamic-v1.0.0';

// Recursos críticos para cache inicial
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/globals.css',
  // Agregar más recursos estáticos según sea necesario
];

// Recursos que se cachean dinámicamente
const DYNAMIC_PATTERNS = [
  /^\/api\//,
  /^\/_next\/static\//,
  /\.(png|jpg|jpeg|svg|webp|gif|ico)$/,
  /\.(woff|woff2|ttf|eot)$/,
];

// Página offline fallback
const OFFLINE_FALLBACK = '/offline.html';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');

  event.waitUntil(
    Promise.all([
      // Cache recursos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Forzar activación inmediata
      self.skipWaiting()
    ])
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');

  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Tomar control inmediato
      self.clients.claim()
    ])
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen
  if (url.origin !== location.origin) return;

  // Estrategia Network First para API calls
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Estrategia Cache First para recursos estáticos
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Estrategia Stale While Revalidate para páginas
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default: Network First con fallback
  event.respondWith(networkFirstWithFallback(request));
});

// Estrategias de cache

function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      // Cache successful responses
      if (response.ok) {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    })
    .catch(() => {
      // Fallback to cache
      return caches.match(request);
    });
}

function cacheFirstStrategy(request) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
    });
}

function staleWhileRevalidateStrategy(request) {
  return caches.match(request)
    .then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Return offline fallback for navigation requests
          if (request.destination === 'document') {
            return caches.match(OFFLINE_FALLBACK);
          }
        });

      // Return cached version immediately if available
      return cachedResponse || fetchPromise;
    });
}

function networkFirstWithFallback(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
}

// Background Sync para compras offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync-tickets') {
    event.waitUntil(syncPendingTickets());
  }

  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ravehub', options)
  );
});

// Click en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Funciones auxiliares

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         DYNAMIC_PATTERNS.some(pattern => pattern.test(url));
}

async function syncPendingTickets() {
  try {
    // Implementar sincronización de tickets pendientes
    console.log('[SW] Syncing pending tickets');

    // Obtener tickets pendientes de IndexedDB
    const pendingTickets = await getPendingTicketsFromIndexedDB();

    for (const ticket of pendingTickets) {
      try {
        // Intentar enviar a la API
        const response = await fetch('/api/tickets/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticket)
        });

        if (response.ok) {
          // Marcar como sincronizado
          await markTicketAsSynced(ticket.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync ticket:', ticket.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncPendingOrders() {
  try {
    // Implementar sincronización de órdenes pendientes
    console.log('[SW] Syncing pending orders');

    const pendingOrders = await getPendingOrdersFromIndexedDB();

    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });

        if (response.ok) {
          await markOrderAsSynced(order.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Placeholder functions - implementar según la lógica de la app
function getPendingTicketsFromIndexedDB() {
  return Promise.resolve([]);
}

function markTicketAsSynced(id) {
  return Promise.resolve();
}

function getPendingOrdersFromIndexedDB() {
  return Promise.resolve([]);
}

function markOrderAsSynced(id) {
  return Promise.resolve();
}
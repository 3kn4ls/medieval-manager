const CACHE_NAME = 'medieval-manager-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/polyfills.js',
  '/runtime.js',
];

// Instalar service worker y cachear recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('Failed to cache:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activar service worker y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

// Estrategia de caché: Network First con fallback a caché
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, cachearla
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde caché
        return caches.match(event.request);
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  let notification = {
    title: 'Medieval Manager',
    body: 'Nueva notificación',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    data: {},
  };

  if (event.data) {
    try {
      notification = event.data.json();
    } catch (e) {
      notification.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      vibrate: [200, 100, 200],
      tag: notification.data.tag || 'default',
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/orders';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla y navegar
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no, abrir una nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

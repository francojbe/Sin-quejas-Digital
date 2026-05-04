/* OneSignal Service Worker */
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Lógica personalizada para evitar abrir múltiples pestañas
self.addEventListener('notificationclick', function(event) {
  // Solo aplicamos esto si hay una URL definida en la notificación
  const targetUrl = event.notification.data?.url || self.location.origin + '/';

  event.notification.close(); // Cerramos la notificación

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Buscamos si hay alguna pestaña con nuestra URL ya abierta
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // Si encontramos la pestaña, la enfocamos
        if (client.url.includes(self.location.host) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ninguna pestaña abierta, abrimos una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

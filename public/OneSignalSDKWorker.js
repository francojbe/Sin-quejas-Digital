/* OneSignal Service Worker - Custom Focus Logic */

// Ponemos nuestro listener AL PRINCIPIO para capturar el evento antes que OneSignal
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click detected. Handling focus logic...');
  
  // Detenemos que OneSignal abra su propia ventana automáticamente
  event.stopImmediatePropagation();
  
  const targetUrl = event.notification.data?.url || self.location.origin + '/';
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Buscamos cualquier ventana que pertenezca a nuestro dominio
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        const clientPath = new URL(client.url).pathname;
        const targetPath = new URL(targetUrl).pathname;

        // Si la ventana ya está en el juego, la enfocamos
        if (client.url.includes(self.location.host) && 'focus' in client) {
          console.log('[Service Worker] Found existing window, focusing...');
          return client.focus();
        }
      }
      
      // Si no hay ninguna, abrimos una nueva
      if (clients.openWindow) {
        console.log('[Service Worker] No existing window found, opening new one...');
        return clients.openWindow(targetUrl);
      }
    })
  );
}, true); // El 'true' activa la fase de captura para ser los primeros

// Luego cargamos el resto de OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

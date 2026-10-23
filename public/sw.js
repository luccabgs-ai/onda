// Service worker do Onda — só cuida das notificações. Não guarda nada em cache: o app
// continua precisando de internet, como sempre.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  if (!event.data) return;
  const dados = event.data.json();
  event.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: '/icone-192.png',
      badge: '/icone-192.png',
      // Mesmo momento do dia substitui a notificação anterior em vez de empilhar.
      tag: dados.tag,
      data: { url: dados.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(janelas => {
      // App já aberto: traz pra frente em vez de abrir outra janela.
      for (const janela of janelas) {
        if ('focus' in janela) return janela.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

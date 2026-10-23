// Service worker: deixa o site instalável e mais rápido. Regras de segurança:
//  - NUNCA guarda /api, /admin, /pedido (link secreto do ingresso) nem /convite (link secreto de acesso);
//  - só GET do próprio domínio; só respostas 200.
// Páginas: rede primeiro (conteúdo sempre fresco), cache só se estiver offline. Arquivos estáticos: cache + atualização em segundo plano.
const VERSION = 'tdc-v1';
const OFFLINE = '/offline.html';
const PRIVATE = /^\/(api|admin|pedido|convite)(\/|$)/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll([OFFLINE, '/css/site.css', '/img/favicon.svg'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || PRIVATE.test(url.pathname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
      .catch(async () => (await caches.match(req)) || caches.match(OFFLINE)));
    return;
  }
  if (/\.(?:css|js|svg|png|jpe?g|webp|woff2)$/.test(url.pathname)) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});

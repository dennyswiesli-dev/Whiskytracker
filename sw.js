/* Whisky Vault: einfacher Service Worker.
   Netzwerk zuerst, damit Updates sofort ankommen. Nur wenn man offline ist, kommt die App aus dem Zwischenspeicher.
   Datenabfragen (Firestore, Anmeldung, Online-Suche) laufen immer direkt ueber das Netzwerk. */
const CACHE = 'whisky-vault-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
const HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const sameOrigin = u.origin === self.location.origin;
  if (!sameOrigin && !HOSTS.includes(u.hostname)) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(r, copy));
        }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});

/* Tipp auf eine Systemmeldung: App in den Vordergrund holen */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow('./');
  }));
});

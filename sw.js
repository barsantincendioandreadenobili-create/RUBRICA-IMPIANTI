const CACHE_NAME = 'rubrica-impianti-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never intercept Firestore/Firebase or other cross-origin API calls: always go to network.
  if (url.origin !== self.location.origin) return;

  // Network-first, bypassando anche la cache HTTP del browser (non solo quella
  // dell'app): su iOS, le app salvate in Home a volte tengono una copia della
  // pagina piu' "attaccata" del normale, quindi qui forziamo sempre una vera
  // richiesta di rete fresca quando c'e' connessione, usando la cache solo
  // come riserva per l'uso offline.
  const freshRequest = new Request(event.request, { cache: 'no-store' });

  event.respondWith(
    fetch(freshRequest)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

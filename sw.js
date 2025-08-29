const CACHE_NAME = "conrinyx-cache-v4";

const PRECACHE = [
  "/Conrinyx/",
  "/Conrinyx/index.html",
  "/Conrinyx/characters/index.html",
  "/Conrinyx/characters/show.html",
  "/Conrinyx/data/characters.json",
  "/Conrinyx/icon-192.png",
  "/Conrinyx/icon-512.png",
  // ev. maskable-ikoner och css
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// HTML: nät först, fallback offline
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(event.request);
          return resp;
        } catch (_) {
          const cache = await caches.open(CACHE_NAME);
          return cache.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // Övrigt: cache först, annars hämta och cacha
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached ||
      fetch(event.request).then(resp => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resp.clone());
          return resp;
        });
      })
    )
  );
});

// sw.js  (ERSÄTT HELA ELLER ÄNDRA TILL MINS DETTA)
const CACHE_NAME = "conrinyx-cache-v8";  // <- bumpa v-numret
const PRECACHE = [
  "/Conrinyx/",
  "/Conrinyx/index.html",
  "/Conrinyx/characters/index.html",
  "/Conrinyx/characters/show.html",
  "/Conrinyx/characters.json",
  "/Conrinyx/icon-192.png",
  "/Conrinyx/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)));
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

// HTML/JSON: nätet först (så nya data slår igenom); annars cache
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isDoc = req.mode === "navigate" || req.destination === "document";
  const isJson = req.url.endsWith(".json");

  if (isDoc || isJson) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          // uppdatera cache i bakgrunden
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached || caches.match("/Conrinyx/index.html");
        }
      })()
    );
    return;
  }

  // Övrigt: cache först, annars hämta och cacha
  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(resp => {
        return caches.open(CACHE_NAME).then(c => {
          c.put(req, resp.clone());
          return resp;
        });
      })
    )
  );
});

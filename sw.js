// sw.js — enkel, robust offline + cache för GitHub Pages
const CACHE_NAME   = "conrinyx-cache-v4";
const OFFLINE_URL  = "/Conrinyx/offline.html";

// Filer att förladda (lägg till fler vid behov)
const PRECACHE = [
  "/Conrinyx/",
  "/Conrinyx/index.html",
  OFFLINE_URL,
  "/Conrinyx/manifest.json",
  "/Conrinyx/icon-192.png",
  "/Conrinyx/icon-512.png"
];

/* ----- INSTALL: förladda viktiga filer ----- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

/* ----- ACTIVATE: rensa gammal cache ----- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

/* ----- FETCH: HTML = network-first + offline fallback,
                 övrigt = cache-first + uppdatera i bakgrunden ----- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // HTML-sidor (navigering)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // prova nätet först
          const net = await fetch(req);
          return net;
        } catch (e) {
          // offline: ge cachad sida eller offline.html
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match("/Conrinyx/index.html");
          return cached || cache.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // Övriga resurser (bilder, js, css) — cache-first
  event.respondWith(
    caches.match(req).then((hit) => {
      const fetchAndCache = fetch(req).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        return resp;
      });
      return hit || fetchAndCache;
    })
  );
});

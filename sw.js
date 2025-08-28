// sw.js — enkel, robust offline + cache
const CACHE_NAME = "conrinyx-cache-v3";
const OFFLINE_URL = "/offline.html";

// Filer att förladda i cachen (lägg till vid behov)
const PRECACHE = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// ----- INSTALL: förladda viktiga filer -----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ----- ACTIVATE: rensa gammal cache -----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ----- FETCH: HTML => network-first + offline-fallback -----
// Övriga resurser => cache-first (med uppdatering i bakgrunden)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navigationsförfrågningar (HTML-sidor)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Försök nätet först
          const fresh = await fetch(req);
          return fresh;
        } catch {
          // Fallback till cache: index eller offline
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = await cache.match("/index.html");
          return cachedIndex || (await cache.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  // Övriga: cache först, annars nät, sen cacha svaret
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          return resp;
        })
        .catch(() => caches.match(OFFLINE_URL)); // sista utväg
    })
  );
});

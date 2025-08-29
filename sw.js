// /Conrinyx/sw.js
const CACHE_NAME = "conrinyx-cache-v8";

const PRECACHE = [
  "/Conrinyx/",
  "/Conrinyx/index.html",
  "/Conrinyx/characters/index.html",
  "/Conrinyx/characters/show.html",
  "/Conrinyx/characters.json",
  "/Conrinyx/icon-192.png",
  "/Conrinyx/icon-512.png",
  // lägg till fler statiska filer här vid behov (css, maskable-ikoner, m.m.)
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// HTML: nät först, fallback till startsidan offline
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (_) {
          const cache = await caches.open(CACHE_NAME);
          return cache.match("/Conrinyx/index.html");
        }
      })()
    );
    return;
  }

  // Övriga resurser: cache-first, annars hämta och cacha
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((resp) =>
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resp.clone());
            return resp;
          })
        )
    )
  );
});

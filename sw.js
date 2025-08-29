// BUMPA version vid varje ändring
const CACHE_NAME = "conrinyx-cache-v7";

// Offline-sida (du har offline.html i roten)
const OFFLINE_URL = "/offline.html";

// Filer som finns i ditt repo enligt dina skärmdumpar
const PRECACHE = [
  "/",                         // root
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/characters.json",
  "/characters/",
  "/characters/index.html",
  "/characters/show.html",
  "/images/characters/conri.webp",
  OFFLINE_URL
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
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      )
    )
  );
  self.clients.claim();
});

// Navigationsförfrågningar: network-first, fallback till offline.html
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const resp = await cache.match(OFFLINE_URL);
          return resp || new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }

  // Övrigt: cache-first, annars hämta och cacha
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        // Bara cacha OK-svar
        if (!resp || resp.status !== 200 || resp.type === "opaque") return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return resp;
      });
    })
  );
});

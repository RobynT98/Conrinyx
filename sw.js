const CACHE_NAME = "conrinyx-cache-v7";
const OFFLINE_URL = "/Conrinyx/offline.html";

const PRECACHE = [
  "/Conrinyx/",
  "/Conrinyx/index.html",
  "/Conrinyx/offline.html",
  "/Conrinyx/characters/index.html",
  "/Conrinyx/characters/show.html",
  "/Conrinyx/characters.json",
  "/Conrinyx/icon-192.png",
  "/Conrinyx/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Navigations: nät först, fallback offline
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        return cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" }});
      }
    })());
    return;
  }

  // Övrigt: cache först, annars hämta + cacha
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached ||
      fetch(event.request).then(resp =>
        caches.open(CACHE_NAME).then(cache => { cache.put(event.request, resp.clone()); return resp; })
      )
    )
  );
});

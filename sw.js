// sw.js
const CACHE_NAME = "conrinx-cache-v7";   // <- bumpa
const PRECACHE = [
  "/Conrinx/",
  "/Conrinx/index.html",
  "/Conrinx/characters/index.html",
  "/Conrinx/characters/show.html",
  "/Conrinx/characters.json",     // <- din JSON ligger i roten (stämmer med din repo)
  "/Conrinx/icon-192.png",
  "/Conrinx/icon-512.png",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : undefined)))
    )
  );
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  // HTML: nät först, cache fallback
  if (e.request.mode === "navigate") {
    e.respondWith(
      (async () => {
        try { return await fetch(e.request); }
        catch { return (await caches.open(CACHE_NAME)).match("/Conrinx/index.html"); }
      })()
    );
    return;
  }
  // Övriga filer: cache först, annars hämta + cacha
  e.respondWith(
    caches.match(e.request).then(
      cached => cached || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return resp;
      })
    )
  );
});

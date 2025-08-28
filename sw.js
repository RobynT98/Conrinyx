// sw.js – ConriNyx Scenarioindex
const CACHE_NAME = "conrinyx-cache-v5";
const FILES_TO_CACHE = [
  "/Conrinyx-senarie.index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/sw.js"
];

// Install – lägg filer i cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate – ta bort gamla cacheversioner
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch - network first för html, cache first för övriga
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // För sidor (HTML) – försök nätverk först
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/Conrinyx-senarie.index.html") // ✅ rätt filnamn
      )
    );
  } else {
    // För bilder, js, css etc – kolla cache först
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((resp) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resp.clone());
              return resp;
            });
          })
        );
      })
    );
  }
});
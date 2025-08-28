// sw.js — Workbox + GitHub Pages–säkert
const CACHE = "conrinyx-pwa-v1";

// Import Workbox (ok att ladda cross-origin)
importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

// Bas-sökväg = SW:ns scope ("/Conrinyx/" på GitHub Pages, "/" lokalt)
const BASE = new URL(self.registration.scope).pathname;

// Offline-sida vi ska visa om navigering misslyckas
const offlineFallbackPage = BASE + "offline.html";

// Snabb uppdatering
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Installera: lägg offline-sidan i cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([offlineFallbackPage]))
  );
  self.skipWaiting();
});

// Aktivera navigation preload om möjligt
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Cache-strategi för statiska resurser (bilder/js/css)
workbox.routing.registerRoute(
  ({request}) => ["script", "style", "image", "font"].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: CACHE })
);

// Navigeringar (HTML): Network First med fallback till offline.html
workbox.routing.registerRoute(
  ({request}) => request.mode === "navigate",
  async ({event}) => {
    try {
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
      return await fetch(event.request);
    } catch (err) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(offlineFallbackPage);
      return cached || Response.error();
    }
  }
);

// sw.js — Property Bills Manager Service Worker
// Update CACHE_VERSION with every new deploy to force cache refresh
const CACHE_VERSION = "bills-tracker-2026-03-29-v1.3";
const CACHE_NAME = CACHE_VERSION;

self.addEventListener("install", event => {
  console.log("[SW] Installing:", CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("[SW] Activating:", CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

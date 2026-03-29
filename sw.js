// sw.js — Property Bills Manager Service Worker
// Update CACHE_VERSION with every new deploy to force cache refresh
const CACHE_VERSION = "bills-tracker-2026-03-29-v1.2";
const CACHE_NAME = CACHE_VERSION;

// On install — cache nothing (network-first strategy)
self.addEventListener("install", event => {
  console.log("[SW] Installing:", CACHE_NAME);
  self.skipWaiting(); // Take control immediately
});

// On activate — delete all old caches
self.addEventListener("activate", event => {
  console.log("[SW] Activating:", CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network first, fall back to cache
self.addEventListener("fetch", event => {
  // Skip non-GET and cross-origin requests
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a copy of the fresh response
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        // Network failed — serve from cache if available
        caches.match(event.request)
      )
  );
});

// Listen for SKIP_WAITING message from the app
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("[SW] Skip waiting triggered");
    self.skipWaiting();
  }
});

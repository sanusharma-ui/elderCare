// स्मृति • Smriti PWA Service Worker (Production Only)
const CACHE_NAME = "smriti-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. STRICT NETWORK-ONLY for all API endpoints and mutation requests
  // Medical schedules, doses, and patient health data must NEVER be served stale from cache.
  if (url.pathname.startsWith("/api/") || event.request.method !== "GET") {
    return;
  }

  // 2. Cache-First for static Next.js assets and immutable fonts
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Network-First with Offline Page fallback for navigation (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL).then((offlineResponse) => {
          return offlineResponse || new Response("You are offline. Please reconnect to view your medicines.", {
            headers: { "Content-Type": "text/html" }
          });
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback for other assets
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

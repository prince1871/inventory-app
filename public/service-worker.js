// ============================================================
// service-worker.js — Offline PWA Support
// ============================================================
const CACHE_NAME = "inventory-v1.0.0";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/api.js",
  "/js/ui.js",
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap",
];

// ─── Install Event ────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate Event ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch Event (Cache-First for assets, Network-First for API) ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: Network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

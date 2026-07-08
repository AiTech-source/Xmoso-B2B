// Xmoso PWA Service Worker
const CACHE = "xmoso-v1";
const ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first for pages, cache-first for static assets
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.match(/\.(ico|svg|webp|png|jpg|css|js|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first for pages
  event.respondWith(
    fetch(request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((cache) => cache.put(request, clone));
      return res;
    }).catch(() => caches.match(request))
  );
});

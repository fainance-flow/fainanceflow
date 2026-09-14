const CACHE_VERSION = "v1";
const PRECACHE = `financeflow-precache-${CACHE_VERSION}`;
const RUNTIME = `financeflow-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PRECACHE).then((cache) => cache.addAll([OFFLINE_URL])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== PRECACHE && key !== RUNTIME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/.test(url.pathname)
  );
}

// Only same-origin GETs are ever intercepted — the backend API lives on a different
// origin and must always pass straight through untouched (see .claude/rules if this
// gets a docs file; the reasoning mirrors advisoryhub-ui's sw.js).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached ?? fetchPromise;
      })
    );
  }
});

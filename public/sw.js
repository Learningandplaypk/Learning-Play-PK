// Learn & Play PK — Service Worker (offline-first shell + runtime cache)
const VERSION = "lpk-v3";
const SHELL = [
  "/",
  "/learn",
  "/brain",
  "/quiz",
  "/fun",
  "/offline",
  "/manifest.webmanifest",
];
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SHELL_CACHE = `${VERSION}-shell`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // page navigations: network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match("/offline"))
        )
    );
    return;
  }

  // static assets (/_next/static, images): cache-first
  if (url.pathname.startsWith("/_next/static") || /\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // R3F/three chunks and everything else: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});

// push notifications (streak reminders)
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}
  const n = data.notification ?? {};
  event.waitUntil(
    self.registration.showNotification(n.title ?? "Learn & Play PK", {
      body: n.body ?? "Aaj ka streak bacha lo! 🔥",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: n.click_action ?? "/fun" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/fun";
  event.waitUntil(clients.openWindow(url));
});

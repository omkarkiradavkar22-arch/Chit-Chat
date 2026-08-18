/* eslint-disable no-restricted-globals */

// Required by vite-plugin-pwa's "injectManifest" strategy — this
// identifier gets replaced at build time with the list of files to
// precache. We don't need offline caching for this app, so we just
// reference it (that satisfies the build) without adding workbox.
const __PRECACHE_MANIFEST__ = self.__WB_MANIFEST;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// =========================
// 🔔 PUSH — fires even when the app/tab is fully closed, as long as
// the browser is running (this is what makes it behave like
// WhatsApp/Instagram notifications).
// =========================
self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = {
      title: "Chit chat",
      body: event.data ? event.data.text() : "You have a new notification",
    };
  }

  const title = payload.title || "Chit chat";

  const options = {
    body: payload.body || "You have a new notification",
    icon: "/chit-chat-logo-192x192.png",
    badge: "/chit-chat-logo-192x192.png",
    tag: payload.tag,
    renotify: Boolean(payload.tag),
    data: {
      url: payload.url || "/",
      ...payload,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =========================
// Clicking the OS notification focuses/opens the app at the right screen
// =========================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

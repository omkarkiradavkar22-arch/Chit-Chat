importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBoZgFqqyCe7LpnwhwD5qxlAZV0Ort4HvM",
  authDomain: "chit-chat-bee3a.firebaseapp.com",
  projectId: "chit-chat-bee3a",
  storageBucket: "chit-chat-bee3a.firebasestorage.app",
  messagingSenderId: "894695595587",
  appId: "1:894695595587:web:405a294aedd20f798ffef6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title ||
    "Chit chat";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "You have a new notification",
    icon: "/chit-chat-logo-192x192.png",
    badge: "/chit-chat-logo-192x192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
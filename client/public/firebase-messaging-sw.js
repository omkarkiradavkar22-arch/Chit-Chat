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

  const data = payload.data || {};

const notificationOptions = {
  body:
    payload.notification?.body ||
    "You have a new notification",

  icon:
    data.callerPic ||
    "/chit-chat-logo-192x192.png",

  badge: "/chit-chat-logo-192x192.png",

  data,

  // Incoming call notification only
  ...(data.type === "incoming_call"
    ? {
        requireInteraction: true,

        tag:
          data.tag ||
          `incoming-call-${
            data.chatId || data.callerId || "unknown"
          }`,

        actions: [
          {
            action: "accept-call",
            title: "Accept",
          },
          {
            action: "decline-call",
            title: "Decline",
          },
        ],
      }
    : {}),
};

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  let targetUrl = data.url || "/";

  // Incoming call notification
  if (data.type === "incoming_call") {
    let callAction = "open";

    if (action === "accept-call") {
      callAction = "accept";
    }

    if (action === "decline-call") {
      callAction = "decline";
    }

    const chatId = data.chatId || "";

    targetUrl =
      `/chat/${chatId}` +
      `?callAction=${callAction}` +
      `&callerId=${encodeURIComponent(data.callerId || "")}` +
      `&callType=${encodeURIComponent(data.callType || "audio")}` +
      `&callId=${encodeURIComponent(data.callId || "")}`;
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            "focus" in client
          ) {
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }

            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

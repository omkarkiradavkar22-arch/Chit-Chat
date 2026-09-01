/* eslint-disable no-restricted-globals */

const __PRECACHE_MANIFEST__ = self.__WB_MANIFEST;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});


// ======================================================
// 🔔 PUSH
// ======================================================

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = {
      title: "Chit chat",
      body: event.data
        ? event.data.text()
        : "You have a new notification",
    };
  }

  console.log("🔔 PUSH RECEIVED:", payload);

  const type = payload.type;


  // ======================================================
  // 📞 INCOMING CALL
  // ======================================================

  if (type === "incoming_call") {
    const callerName =
      payload.callerName || "Someone";

    const callType =
      payload.callType || "audio";

    const chatId =
      payload.chatId || "";

    const callerId =
      payload.callerId || "";

    const incomingTag =
      payload.tag ||
      `incoming-call-${chatId || callerId}`;


    const options = {
      body:
        callType === "video"
          ? "Incoming video call"
          : "Incoming audio call",

      // Caller photo if available
      icon:
        payload.callerPic ||
        "/chit-chat-logo-192x192.png",

      badge:
        "/chit-chat-logo-192x192.png",

      tag: incomingTag,

      // Try to keep call notification visible
      requireInteraction: true,

      renotify: true,

      // Supported devices may vibrate like a call
      vibrate: [
        300,
        100,
        300,
        100,
        300,
      ],

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

      data: {
        type: "incoming_call",

        callerId,
        callerName,

        callerPic:
          payload.callerPic || "",

        callType,
        chatId,

        callId:
          payload.callId || "",

        incomingTag,

        url:
          payload.url ||
          (chatId
            ? `/chat/${chatId}`
            : "/"),
      },
    };


    event.waitUntil(
      self.registration.showNotification(
        `${callerName} is calling`,
        options
      )
    );

    return;
  }


  // ======================================================
  // 📵 MISSED CALL
  // ======================================================

  if (type === "missed_call") {
    const callerName =
      payload.callerName || "Someone";

    const callType =
      payload.callType || "audio";

    const chatId =
      payload.chatId || "";

    const callerId =
      payload.callerId || "";


    event.waitUntil(
      (async () => {

        // ----------------------------------------------
        // Close old incoming-call notification first
        // ----------------------------------------------

        const incomingTags = [
          `incoming-call-${chatId}`,
          `incoming-call-${callerId}`,
        ];

        const notifications =
          await self.registration.getNotifications();

        notifications.forEach(
          (notification) => {
            if (
              incomingTags.includes(
                notification.tag
              )
            ) {
              notification.close();
            }
          }
        );


        // ----------------------------------------------
        // Now show missed call
        // ----------------------------------------------

        await self.registration.showNotification(
          `Missed call from ${callerName}`,
          {
            body:
              callType === "video"
                ? "Missed video call"
                : "Missed audio call",

            icon:
              payload.callerPic ||
              "/chit-chat-logo-192x192.png",

            badge:
              "/chit-chat-logo-192x192.png",

            tag:
              `missed-call-${
                chatId || callerId
              }`,

            data: {
              type: "missed_call",

              callerId,
              callerName,

              chatId,

              url:
                payload.url ||
                (chatId
                  ? `/chat/${chatId}`
                  : "/"),
            },
          }
        );
      })()
    );

    return;
  }


  // ======================================================
  // 💬 NORMAL PUSH NOTIFICATION
  // ======================================================

  const title =
    payload.title || "Chit chat";

  const options = {
    body:
      payload.body ||
      "You have a new notification",

    icon:
      "/chit-chat-logo-192x192.png",

    badge:
      "/chit-chat-logo-192x192.png",

    tag: payload.tag,

    renotify: Boolean(payload.tag),

    data: {
      url: payload.url || "/",
      ...payload,
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


// ======================================================
// 🖱️ NOTIFICATION CLICK / ACTION BUTTONS
// ======================================================

self.addEventListener(
  "notificationclick",
  (event) => {

    const data =
      event.notification.data || {};

    const action =
      event.action;

    console.log(
      "📞 Notification action:",
      action,
      data
    );


    // ==================================================
    // 🟢 ACCEPT CALL
    // ==================================================

    if (action === "accept-call") {

      event.notification.close();

      const targetUrl =
        `/chat/${data.chatId}` +
        `?callAction=accept` +
        `&callerId=${encodeURIComponent(
          data.callerId || ""
        )}` +
        `&callType=${encodeURIComponent(
          data.callType || "audio"
        )}` +
        `&callId=${encodeURIComponent(
          data.callId || ""
        )}`;

      event.waitUntil(
        openOrFocusApp(targetUrl)
      );

      return;
    }


    // ==================================================
    // 🔴 DECLINE CALL
    // ==================================================

 if (action === "decline-call") {
  event.notification.close();

  const targetUrl =
    `/chat/${data.chatId}` +
    `?callAction=decline` +
    `&callerId=${encodeURIComponent(
      data.callerId || ""
    )}` +
    `&callType=${encodeURIComponent(
      data.callType || "audio"
    )}` +
    `&callId=${encodeURIComponent(
      data.callId || ""
    )}`;

  event.waitUntil(
    openOrFocusApp(targetUrl)
  );

  return;
}


    // ==================================================
    // 👆 CLICK ON INCOMING CALL NOTIFICATION ITSELF
    // ==================================================

    if (data.type === "incoming_call") {

      event.notification.close();

      const targetUrl =
        `/chat/${data.chatId}` +
        `?callAction=open` +
        `&callerId=${encodeURIComponent(
          data.callerId || ""
        )}` +
        `&callType=${encodeURIComponent(
          data.callType || "audio"
        )}` +
        `&callId=${encodeURIComponent(
          data.callId || ""
        )}`;

      event.waitUntil(
        openOrFocusApp(targetUrl)
      );

      return;
    }


    // ==================================================
    // 💬 NORMAL / MISSED CALL CLICK
    // ==================================================

    event.notification.close();

    const targetUrl =
      data.url || "/";

    event.waitUntil(
      openOrFocusApp(targetUrl)
    );
  }
);


// ======================================================
// 🚀 OPEN OR FOCUS CHIT-CHAT
// ======================================================

async function openOrFocusApp(
  targetUrl
) {

  const clientList =
    await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });


  // App already open/background
  for (const client of clientList) {

    if (
      client.url.includes(
        self.location.origin
      ) &&
      "focus" in client
    ) {

      if ("navigate" in client) {
        await client.navigate(
          targetUrl
        );
      }

      return client.focus();
    }
  }


  // App fully closed
  if (self.clients.openWindow) {
    return self.clients.openWindow(
      targetUrl
    );
  }
}

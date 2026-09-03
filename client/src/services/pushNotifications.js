import api from "./api";

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 =
    (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
}

export const enablePushNotifications =
  async () => {
    try {
      if (!("serviceWorker" in navigator)) {
        console.log("Service Worker not supported");
        return;
      }

      if (!("PushManager" in window)) {
        console.log("Push API not supported");
        return;
      }

      if (!("Notification" in window)) {
        console.log("Notifications not supported");
        return;
      }

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        console.log(
          "Notification permission denied"
        );
        return;
      }

      const registration =
        await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,

            applicationServerKey:
              urlBase64ToUint8Array(
                VAPID_PUBLIC_KEY
              ),
          });
      }

      await api.post(
        "/push/subscribe",
        {
          subscription,
        }
      );

      console.log(
        "🔔 Push notifications enabled"
      );

      return subscription;
    } catch (error) {
      console.error(
        "ENABLE PUSH ERROR:",
        error
      );
    }
  };
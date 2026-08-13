import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBoZgFqqyCe7LpnwhwD5qxlAZV0Ort4HvM",
  authDomain: "chit-chat-bee3a.firebaseapp.com",
  projectId: "chit-chat-bee3a",
  storageBucket: "chit-chat-bee3a.firebasestorage.app",
  messagingSenderId: "894695595587",
  appId: "1:894695595587:web:405a294aedd20f798ffef6",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    // Ask browser notification permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    console.log("✅ Notification permission granted");

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration:
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        ),
    });

    console.log("🔥 FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.error(
      "❌ FCM notification setup error:",
      error
    );

    return null;
  }
};

export const listenForForegroundMessages = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log("📩 Foreground FCM message:", payload);

    callback(payload);
  });
};

export default app;
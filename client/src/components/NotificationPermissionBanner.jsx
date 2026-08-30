import { useEffect, useState } from "react";
import { enablePushNotifications } from "../services/pushNotifications";
import { useAuth } from "../context/AuthContext";

// Shows a small "Enable notifications" prompt after login, but only
// requests the browser permission when the user actually taps the
// button — a real click/tap is required or iOS Safari / mobile Chrome
// silently ignore the request.
const NotificationPermissionBanner = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!("Notification" in window)) return;

    const dismissed = localStorage.getItem("notifBannerDismissed");
    if (Notification.permission === "default" && !dismissed) {
      setVisible(true);
    }
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    await enablePushNotifications();
    setLoading(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("notifBannerDismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg">
      <span className="text-sm">Turn on notifications for messages &amp; calls?</span>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="text-sm font-medium bg-white text-neutral-900 px-3 py-1 rounded-lg disabled:opacity-60"
      >
        {loading ? "Enabling..." : "Enable"}
      </button>
      <button
        onClick={handleDismiss}
        className="text-sm text-neutral-400 hover:text-white"
      >
        Not now
      </button>
    </div>
  );
};

export default NotificationPermissionBanner;
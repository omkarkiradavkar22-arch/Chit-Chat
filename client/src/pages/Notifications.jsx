import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import NotificationCard from "../components/Notifications/NotificationCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

const NOTIFICATIONS_CACHE_KEY =
  "chitchat_notifications_cache";

  const getCachedNotifications = () => {
  try {
    const cachedData = localStorage.getItem(
      NOTIFICATIONS_CACHE_KEY
    );

    if (!cachedData) {
      return [];
    }

    const parsedData = JSON.parse(cachedData);

    return parsedData.notifications || [];
  } catch (error) {
    console.error(
      "Notifications cache parse error:",
      error
    );

    return [];
  }
};

function Notifications() {
  const [notifications, setNotifications] =
  useState(() => getCachedNotifications());

 const getNotifications = async () => {
  try {
    // =========================
    // OFFLINE → LOAD CACHE
    // =========================

    if (!navigator.onLine) {
      const cachedData = localStorage.getItem(
        NOTIFICATIONS_CACHE_KEY
      );

      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);

          setNotifications(
            parsedData.notifications || []
          );
        } catch (error) {
          console.error(
            "Notifications cache parse error:",
            error
          );

          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }

      return;
    }

    // =========================
    // ONLINE → API
    // =========================

    const { data } = await api.get(
      "/notifications"
    );

    const latestNotifications =
      data.notifications || [];

    setNotifications(latestNotifications);

    // Save notifications for offline use
    localStorage.setItem(
      NOTIFICATIONS_CACHE_KEY,
      JSON.stringify({
        notifications: latestNotifications,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    // =========================
    // NETWORK ERROR → CACHE
    // =========================

    const cachedData = localStorage.getItem(
      NOTIFICATIONS_CACHE_KEY
    );

    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);

        setNotifications(
          parsedData.notifications || []
        );

        return;
      } catch (cacheError) {
        console.error(
          "Notifications cache parse error:",
          cacheError
        );
      }
    }

    if (navigator.onLine) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load notifications"
      );
    }
  } 
};

  useEffect(() => {
    getNotifications();
  }, []);

 useEffect(() => {
  if (!navigator.onLine) return;

  const markNotificationsAsRead = async () => {
    const unreadNotifications =
      notifications.filter((n) => !n.isRead);

    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          api.patch(
            `/notifications/${n._id}/read`
          )
        )
      );

      const updatedNotifications =
        notifications.map((n) => ({
          ...n,
          isRead: true,
        }));

      setNotifications(updatedNotifications);

      localStorage.setItem(
        NOTIFICATIONS_CACHE_KEY,
        JSON.stringify({
          notifications:
            updatedNotifications,
          cachedAt: Date.now(),
        })
      );
    } catch (error) {
      console.error(
        "Mark notifications read error:",
        error
      );
    }
  };

  markNotificationsAsRead();
}, [notifications]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5">

        <h1 className="text-3xl font-bold mb-6">
          Notifications
        </h1>

        {notifications.length === 0 ? (
  <p className="text-center text-gray-500">
    No notifications yet.
  </p>
) : (
         notifications.map((notification) => (
  <NotificationCard
    key={notification._id}
    notification={notification}
    onDeleted={(notificationId) => {
  setNotifications((prev) => {
    const updatedNotifications =
      prev.filter(
        (item) =>
          item._id !== notificationId
      );

    localStorage.setItem(
      NOTIFICATIONS_CACHE_KEY,
      JSON.stringify({
        notifications:
          updatedNotifications,
        cachedAt: Date.now(),
      })
    );

    return updatedNotifications;
  });
}}
  />
))
        )}

      </div>
    </Layout>
  );
}

export default Notifications;
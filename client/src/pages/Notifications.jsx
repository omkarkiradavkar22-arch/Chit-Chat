import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import NotificationCard from "../components/notifications/NotificationCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const getNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);
  useEffect(() => {
  notifications.forEach(async (n) => {
    if (!n.isRead) {
      await api.patch(
        `/notifications/${n._id}/read`
      );
    }
  });
}, [notifications]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5">

        <h1 className="text-3xl font-bold mb-6">
          Notifications
        </h1>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500">
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
            />
          ))
        )}

      </div>
    </Layout>
  );
}

export default Notifications;
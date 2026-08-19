import { FaHome, FaSearch,
  FaCompass,
  FaBell,
  FaComments,
  FaUser,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";

function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

 const activeClass =
  "flex items-center gap-4 text-lg font-semibold text-blue-600";

const normalClass =
  "flex items-center gap-4 text-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition";
  // Notification Badge
  const loadUnread = async () => {
    try {
      const { data } = await api.get("/notifications");
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.log(err);
    }
  };

  // Message Badge
  const loadMessageUnread = async () => {
    try {
      const { data } = await api.get("/chat");

      const total = data.chats.reduce(
        (sum, chat) => sum + chat.unreadCount,
        0
      );

      setMessageUnreadCount(total);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadUnread();
      loadMessageUnread();
    }
  }, [user]);

  // Live Notification Badge
  useEffect(() => {
    if (!socket) return;

    socket.on("newNotification", loadUnread);

    return () => {
      socket.off("newNotification", loadUnread);
    };
  }, [socket]);

  // Live Message Badge
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", loadMessageUnread);
    socket.on("messagesSeen", loadMessageUnread);

    return () => {
      socket.off("newMessage", loadMessageUnread);
      socket.off("messagesSeen", loadMessageUnread);
    };
  }, [socket]);

  return (
  <div className="h-screen pt-10 px-5">
    <nav className="space-y-6">

      <Link
        to="/"
        className={pathname === "/" ? activeClass : normalClass}
      >
        <FaHome />
        Home
      </Link>

      <Link
        to="/search"
        className={pathname === "/search" ? activeClass : normalClass}
      >
        <FaSearch />
        Search
      </Link>

      <Link
        to="/explore"
        className={pathname === "/explore" ? activeClass : normalClass}
      >
        <FaCompass />
        Explore
      </Link>

      {/* Notification */}
      <Link
        to="/notifications"
        className={
          pathname === "/notifications"
            ? activeClass
            : normalClass
        }
      >
        <div className="relative">
          <FaBell />

          {unreadCount > 0 && (
            <span
              className="
              absolute
              -top-2
              -right-2
              bg-red-500
              text-white
              text-[10px]
              rounded-full
              min-w-5
              h-5
              flex
              items-center
              justify-center
              px-1
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        Notifications
      </Link>

      {/* Messages */}
      <Link
        to="/chat"
        className={
          pathname.startsWith("/chat")
            ? activeClass
            : normalClass
        }
      >
        <div className="relative">
          <FaComments />

          {messageUnreadCount > 0 && (
            <span
              className="
              absolute
              -top-2
              -right-2
              bg-red-500
              text-white
              text-[10px]
              rounded-full
              min-w-5
              h-5
              flex
              items-center
              justify-center
              px-1
              "
            >
              {messageUnreadCount > 99
                ? "99+"
                : messageUnreadCount}
            </span>
          )}
        </div>

        Messages
      </Link>

      {user && (
        <Link
          to={`/profile/${user.username}`}
          className={
            pathname.startsWith("/profile")
              ? activeClass
              : normalClass
          }
        >
          <FaUser />
          Profile
        </Link>
      )}

    </nav>
  </div>
);
}

export default Sidebar;

import {
  FaHome,
  FaCompass,
  FaBell,
  FaComments,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";

function MobileNavbar() {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
const { user } = useAuth();
const { socket } = useSocket();
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-600";

  const loadUnread = async () => {
    try {
      const { data } = await api.get("/notifications");
      setUnreadCount(data.unreadCount);
    } catch (err) {}
  };

  useEffect(() => {
  if (!socket) return;

  const refreshBadges = () => {
    loadUnread();
    loadMessageUnread();
  };

  socket.on("newMessage", refreshBadges);
  socket.on("messagesSeen", refreshBadges);

  return () => {
    socket.off("newMessage", refreshBadges);
    socket.off("messagesSeen", refreshBadges);
  };
}, [socket]);

  const loadMessageUnread = async () => {
  try {
    const { data } = await api.get("/chat");

    const total = data.chats.reduce(
      (sum, chat) => sum + chat.unreadCount,
      0
    );

    setMessageUnreadCount(total);
  } catch (err) {}
};
  useEffect(() => {
  if (user) {
  loadUnread();
  loadMessageUnread();
}
}, [user]);

  return (
   <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-md h-16 flex justify-around items-center z-50 transition-colors">
      <Link
        to="/"
        className={pathname === "/" ? activeClass : inactiveClass}
      >
        <FaHome size={22} />
      </Link>

     <Link
  to="/chat"
  className={`relative ${
    pathname === "/chat"
      ? activeClass
      : inactiveClass
  }`}
>
  <FaComments size={22} />

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
      {messageUnreadCount}
    </span>
  )}
</Link>

      <Link
        to="/explore"
        className={pathname === "/explore" ? activeClass : inactiveClass}
      >
        <FaCompass size={22} />
      </Link>

      <Link
  to="/notifications"
  className={`relative ${
    pathname === "/notifications"
      ? activeClass
      : inactiveClass
  }`}
>
  <FaBell size={22} />

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
      {unreadCount}
    </span>
  )}
</Link>

      

    </div>
  );
}

export default MobileNavbar;

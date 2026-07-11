import {
  FaHome,
  FaSearch,
  FaCompass,
  FaBell,
  FaComments,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";

function MobileNavbar() {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
const { user } = useAuth();
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-600";

  useEffect(() => {
  const loadUnread = async () => {
    try {
      const { data } = await api.get("/notifications");
      setUnreadCount(data.unreadCount);
    } catch (err) {}
  };

  if (user) {
    loadUnread();
  }
}, [user]);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-md h-16 flex justify-around items-center z-50">

      <Link
        to="/"
        className={pathname === "/" ? activeClass : inactiveClass}
      >
        <FaHome size={22} />
      </Link>

      <Link
        to="/search"
        className={pathname === "/search" ? activeClass : inactiveClass}
      >
        <FaSearch size={22} />
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

      <Link
        to="/chat"
        className={pathname === "/chat" ? activeClass : inactiveClass}
      >
        <FaComments size={22} />
      </Link>

    </div>
  );
}

export default MobileNavbar;
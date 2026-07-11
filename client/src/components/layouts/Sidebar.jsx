import {
  FaHome,
  FaSearch,
  FaCompass,
  FaBell,
  FaComments,
  FaUser,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../services/api";

function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);


  const activeClass =
    "flex items-center gap-4 text-lg font-semibold text-blue-600";

  const normalClass =
    "flex items-center gap-4 text-lg text-gray-700 hover:text-blue-600 transition";
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
        {unreadCount}
      </span>
    )}
  </div>

  Notifications
</Link>

        <Link
          to="/chat"
          className={pathname === "/chat" ? activeClass : normalClass}
        >
          <FaComments />
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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";

function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { theme, setTheme } = useTheme();
  
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
    
const [aiTaskDetection, setAiTaskDetection] = useState(
  user?.aiTaskDetectionEnabled ?? true
);

useEffect(() => {
  if (user) {
    setAiTaskDetection(
      user.aiTaskDetectionEnabled ?? true
    );
  }
}, [user]);
  const isDark = theme === "dark";

  useEffect(() => {
    const closeMenu = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () =>
      document.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 border-b shadow-sm transition-colors duration-300 ${
        isDark
          ? "bg-[#111827] border-gray-700 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">

        {/* LOGO */}
        <Link
          to="/"
          className="text-3xl font-bold text-blue-600"
        >
          ChitChat
        </Link>

        {user && (
          <div
            className="relative"
            ref={menuRef}
          >
            {/* USER BUTTON */}
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <img
                  src={user.profilePic || "/default-profile-picture.png"}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />

                {onlineUsers.includes(user._id) && (
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${
                      isDark
                        ? "border-[#111827]"
                        : "border-white"
                    }`}
                  />
                )}
              </div>

              <span
                className={`hidden md:block font-medium ${
                  isDark
                    ? "text-gray-100"
                    : "text-gray-900"
                }`}
              >
                {user.name}
              </span>
            </button>

            {/* DROPDOWN */}
            {open && (
              <div
                className={`absolute right-0 mt-3 w-56 rounded-xl shadow-lg border overflow-hidden transition-colors duration-200 ${
                  isDark
                    ? "bg-[#1f2937] border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >

                {/* PROFILE */}
                <Link
                  to={`/profile/${user.username}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 transition ${
                    isDark
                      ? "text-gray-200 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>👤</span>
                  <span>Profile</span>
                </Link>

                {/* EDIT PROFILE */}
                <Link
                  to="/edit-profile"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 transition ${
                    isDark
                      ? "text-gray-200 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>✏️</span>
                  <span>Edit Profile</span>
                </Link>

                {/* THEME */}
                <button
                  onClick={() => {
                    setTheme(
                      theme === "light"
                        ? "dark"
                        : "light"
                    );
                  }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-3 transition ${
                    isDark
                      ? "text-gray-200 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {theme === "light"
                    ? "🌙 Dark Theme"
                    : "☀️ Light Theme"}
                </button>

{/* AI TASK DETECTION */}
<button
  onClick={async () => {
    try {
      console.log("🤖 Toggle clicked");

      const { data } = await api.patch(
        "/users/ai-task-detection"
      );

      console.log("🤖 Toggle response:", data);

      setAiTaskDetection(data.aiTaskDetectionEnabled);
    } catch (error) {
      console.error(
        "❌ AI Task Detection toggle error:",
        error.response?.data || error.message
      );
    }
  }}
  className={`w-full text-left flex items-center justify-between px-4 py-3 transition ${
    isDark
      ? "text-gray-200 hover:bg-gray-700"
      : "text-gray-700 hover:bg-gray-100"
  }`}
>
  <span className="flex items-center gap-2">
    <span>🤖</span>
    <span>AI Task Detection</span>
  </span>

  <span
    className={`text-xs font-semibold ${
      aiTaskDetection
        ? "text-green-500"
        : "text-gray-400"
    }`}
  >
    {aiTaskDetection ? "ON" : "OFF"}
  </span>
</button>

                {/* DIVIDER */}
                <div
                  className={`border-t ${
                    isDark
                      ? "border-gray-700"
                      : "border-gray-200"
                  }`}
                />

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className={`w-full text-left flex items-center gap-2 px-4 py-3 transition ${
                    isDark
                      ? "text-red-400 hover:bg-red-900/30"
                      : "text-red-600 hover:bg-red-100"
                  }`}
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>

              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}

export default Navbar;

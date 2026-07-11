import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
function Navbar() {
  const { user, logout } = useAuth();
const { socket } = useSocket();

const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () =>
      document.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
  if (!socket) return;

  socket.on("onlineUsers", (users) => {
    setOnlineUsers(users);
  });

  return () => {
    socket.off("onlineUsers");
  };
}, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 h-16">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">

        <Link
          to="/"
          className="text-3xl font-bold text-blue-600"
        >
          ChitChat
        </Link>

        

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2"
            >
               <img
    src={user.profilePic}
    alt={user.name}
    className="w-10 h-10 rounded-full object-cover"
  />

  {onlineUsers.includes(user._id) && (
    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
  )}


              <span className="hidden md:block font-medium">
                {user.name}
              </span>
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg border overflow-hidden">

                <Link
                  to={`/profile/${user.username}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100"
                >
                  👤 Profile
                </Link>

                <Link
                  to="/edit-profile"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-100"
                >
                  ✏️ Edit Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-100 text-red-600"
                >
                  🚪 Logout
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
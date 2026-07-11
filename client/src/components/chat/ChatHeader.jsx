import { FaPhone, FaVideo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
function ChatHeader({ otherUser, onlineUsers = [] }) {
  const navigate = useNavigate();
  if (!otherUser) {
    return (
      <div className="h-16 bg-white border-b flex items-center px-5">
        <h2 className="text-lg font-semibold">
          Select a chat
        </h2>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(otherUser._id);

  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-5">

      <div className="flex items-center gap-3">

        <div className="relative">

          <img
          onClick={() => navigate(`/profile/${otherUser.username}`)}
            src={
              otherUser.profilePic ||
              "https://placehold.co/100x100?text=User"
            }
            alt={otherUser.name}
            className="w-11 h-11 rounded-full object-cover cursor-pointer ..."
          />

          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          )}

        </div>

        <div>

          <h2 className="font-semibold">
            {otherUser.name}
          </h2>

          <p className="text-sm text-gray-500">
            {isOnline
              ? "Online"
              : otherUser.lastSeen
              ? `Last seen ${new Date(
                  otherUser.lastSeen
                ).toLocaleString()}`
              : "Offline"}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-4 text-gray-600">

        <button className="hover:text-blue-600">
          <FaPhone size={20} />
        </button>

        <button className="hover:text-blue-600">
          <FaVideo size={20} />
        </button>

      </div>

    </div>
  );
}

export default ChatHeader;
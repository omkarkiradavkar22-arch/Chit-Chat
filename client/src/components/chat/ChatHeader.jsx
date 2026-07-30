import { useNavigate } from "react-router-dom";
import { FaPhone, FaVideo, FaEllipsisV } from "react-icons/fa";
import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import MediaGallery from "./MediaGallery";
import { useCall } from "../../context/CallContext";
function ChatHeader({
  otherUser,
  onlineUsers = [],
  chatInfo,
  setChatInfo,
  chatId,
}) { 
   const navigate = useNavigate();
   const [showMenu, setShowMenu] = useState(false);
   const [showGallery, setShowGallery] = useState(false);
   const { startCall } = useCall();
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
    <>
<div className="h-20 min-h-20 bg-white border-b px-5 flex items-center justify-between shadow-sm">
    {/* Left */}
<div className="flex items-center gap-3 flex-1 min-w-0 h-full">
      <div className="relative flex-shrink-0 w-11 h-11">

        <img
          onClick={() =>
            navigate(`/profile/${otherUser.username}`)
          }
          src={
            otherUser.profilePic ||
            "https://placehold.co/100x100?text=User"
          }
          alt={otherUser.name}
          className="w-full h-full rounded-full object-cover cursor-pointer hover:scale-105 transition"
        />

        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />

      </div>

      <div className="flex flex-col justify-center min-w-0">

        <h2
          onClick={() =>
            navigate(`/profile/${otherUser.username}`)
          }
          className="font-semibold text-[15px] cursor-pointer hover:text-blue-600"
        >
          {otherUser.name}
        </h2>

        <p className="text-xs text-gray-500 whitespace-nowrap">
          {isOnline
            ? "🟢 Online"
            :otherUser.lastSeen
  ? `Last seen ${new Date(
      otherUser.lastSeen
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`
  : "Offline"}
        </p>

      </div>

    </div>

    {/* Right */}
    <div className="flex items-center gap-2">

      <button
        onClick={() => startCall(otherUser)}
        className="
        w-10
        h-10
        rounded-full
        hover:bg-gray-100
        flex
        items-center
        justify-center
        transition
        "
      >
        <FaPhone size={18} />
      </button>

      <button
        className="
        w-10
        h-10
        rounded-full
        hover:bg-gray-100
        flex
        items-center
        justify-center
        transition
        "
      >
        <FaVideo size={18} />
      </button>

        <button
  onClick={() => setShowMenu(!showMenu)}
  className="hover:text-blue-600"
>
  <FaEllipsisV size={18} />
</button>

{showMenu && (
  <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border w-48 z-50">

    <button
      onClick={() => {
        setShowGallery(true);
        setShowMenu(false);
      }}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b"
    >
      🖼️ Media, Links &amp; Docs
    </button>

    {!chatInfo?.isBlocked ? (
      <button
        onClick={async () => {
          try {
            await api.post(`/chat/${chatId}/block`);

            setChatInfo({
              ...chatInfo,
              isBlocked: true,
              blockedBy: otherUser._id,
            });

            toast.success("User blocked");
            setShowMenu(false);
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Failed"
            );
          }
        }}
        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600"
      >
        🚫 Block User
      </button>
    ) : (
      <button
        onClick={async () => {
          try {
            await api.post(`/chat/${chatId}/unblock`);

            setChatInfo({
              ...chatInfo,
              isBlocked: false,
              blockedBy: null,
            });

            toast.success("User unblocked");
            setShowMenu(false);
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Failed"
            );
          }
        }}
        className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-600"
      >
        ✅ Unblock User
      </button>
    )}

  </div>
)}

      </div>

    </div>

    <MediaGallery
      chatId={chatId}
      isOpen={showGallery}
      onClose={() => setShowGallery(false)}
    />
    </>
  );
}

export default ChatHeader;

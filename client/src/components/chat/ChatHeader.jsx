import { useNavigate } from "react-router-dom";
import { FaPhone, FaVideo, FaEllipsisV,FaArrowLeft } from "react-icons/fa";
import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import MediaGallery from "./MediaGallery";
import { useCall } from "../../context/CallContext";
function ChatHeader({
  otherUser,
  onlineUsers,
  chatInfo,
  setChatInfo,
  chatId,
  refreshChatInfo,
  setIsSearchOpen,
  setIsAISearchOpen
}) {
   const navigate = useNavigate();
   const [showMenu, setShowMenu] = useState(false);
   const [showGallery, setShowGallery] = useState(false);
   const [showDisappearingMenu, setShowDisappearingMenu] = useState(false);
   const { startCall } = useCall();
  if (!otherUser) {
    return (
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-5 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select a chat
        </h2>
      </div>
    );
  }

  const setDisappearingDuration = async (duration) => {
  try {
    const { data } = await api.put(
      `/chat/${chatId}/disappearing`,
      { duration }
    );

    setChatInfo((prev) => ({
      ...prev,
      disappearingMessages: data.disappearingMessages,
    }));

    setShowDisappearingMenu(false);
    setShowMenu(false);

    const labels = {
      0: "Disappearing messages turned off",
      [24 * 60 * 60]: "Messages will disappear after 24 hours",
      [7 * 24 * 60 * 60]: "Messages will disappear after 7 days",
      [90 * 24 * 60 * 60]: "Messages will disappear after 90 days",
    };

    toast.success(labels[duration] || "Setting updated");
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
        "Failed to update disappearing messages"
    );
  }
};

  const isOnline = onlineUsers.includes(otherUser._id);

  return (
    <>
<div className="h-20 min-h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 flex items-center justify-between shadow-sm transition-colors">
{/* Left */}
<div className="flex items-center gap-2 flex-1 min-w-0 h-full">

  {/* 📱 Mobile Back Button */}
  <button
    onClick={() => navigate("/chat")}
    className="
      md:hidden
      w-9 h-9
      flex-shrink-0
      flex items-center justify-center
      rounded-full
      text-gray-700 dark:text-gray-200
      hover:bg-gray-100 dark:hover:bg-gray-800
      transition
    "
    aria-label="Back to chats"
  >
    <FaArrowLeft size={18} />
  </button>

  {/* Profile */}
  <div className="relative flex-shrink-0 w-11 h-11">
        <img
          onClick={() =>
            navigate(`/profile/${otherUser.username}`)
          }
          src={
            otherUser.profilePic || "/default-profile-picture.png"
          }
          alt={otherUser.name}
          className="w-full h-full rounded-full object-cover cursor-pointer hover:scale-105 transition"
        />

        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />

      </div>

      <div className="flex flex-col justify-center min-w-0">

        <h2
          onClick={() =>
            navigate(`/profile/${otherUser.username}`)
          }
          className="font-semibold text-[15px] text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
        >
          {otherUser.name}
        </h2>

        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
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
  text-gray-700
  dark:text-gray-200
  hover:bg-gray-100
  dark:hover:bg-gray-800
  flex
  items-center
  justify-center
  transition
"
      >
        <FaPhone size={18} />
      </button>

      <button
      onClick={() => startCall(otherUser, "video")}
        className="
  w-10
  h-10
  rounded-full
  text-gray-700
  dark:text-gray-200
  hover:bg-gray-100
  dark:hover:bg-gray-800
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
  className="text-gray-700 dark:text-gray-200 hover:text-blue-600"
>
  <FaEllipsisV size={18} />
</button>



{showMenu && (
  <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-48 z-50 overflow-hidden">


<button
  onClick={() => {
    setIsSearchOpen(true);
    setShowMenu(false);
  }}
  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
>
  🔍 Search Messages
</button>

<button
  onClick={() => {
    setIsAISearchOpen(true);
    setShowMenu(false);
  }}
  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
>
  ✨ AI Search
</button>


    <button
      onClick={() => {
        setShowGallery(true);
        setShowMenu(false);
      }}
      className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
    >
      🖼️ Media, Links &amp; Docs
    </button>

    {/* Disappearing Messages */}
<button
  onClick={() => setShowDisappearingMenu(!showDisappearingMenu)}
  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
>
  <span>⏳ Disappearing Messages</span>

  <span className="text-xs text-gray-400">
    {chatInfo?.disappearingMessages?.enabled
      ? "On"
      : "Off"}
  </span>
</button>

{showDisappearingMenu && (
  <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">

    <p className="px-4 pt-3 pb-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
      Messages disappear after...
    </p>

    {/* Off */}
    <button
      onClick={() => setDisappearingDuration(0)}
      className="w-full text-left px-6 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between"
    >
      <span>❌ Off</span>

      {!chatInfo?.disappearingMessages?.enabled && (
        <span className="text-blue-600">✓</span>
      )}
    </button>

    {/* 24 Hours */}
    <button
      onClick={() =>
        setDisappearingDuration(24 * 60 * 60)
      }
      className="w-full text-left px-6 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:bg-gray-800 flex justify-between"
    >
      <span>⏱️ 24 hours</span>

      {chatInfo?.disappearingMessages?.duration ===
        24 * 60 * 60 && (
        <span className="text-blue-600">✓</span>
      )}
    </button>

    {/* 7 Days */}
    <button
      onClick={() =>
        setDisappearingDuration(7 * 24 * 60 * 60)
      }
      className="w-full text-left px-6 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:bg-gray-800 flex justify-between"
    >
      <span>📅 7 days</span>

      {chatInfo?.disappearingMessages?.duration ===
        7 * 24 * 60 * 60 && (
        <span className="text-blue-600">✓</span>
      )}
    </button>

    {/* 90 Days */}
    <button
      onClick={() =>
        setDisappearingDuration(90 * 24 * 60 * 60)
      }
      className="w-full text-left px-6 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:bg-gray-800 flex justify-between"
    >
      <span>📅 90 days</span>

      {chatInfo?.disappearingMessages?.duration ===
        90 * 24 * 60 * 60 && (
        <span className="text-blue-600">✓</span>
      )}
    </button>

  </div>
)}

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
        className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
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
        className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
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
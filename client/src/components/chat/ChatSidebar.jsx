import api from "../../services/api";
import { Link, useParams } from "react-router-dom";
import {
  FaStar,
  FaTasks,
  FaImage,
  FaVideo,
  FaMicrophone,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaVideoSlash,
  FaShareSquare,
  FaBan,
FaTrash,
} from "react-icons/fa";
import StarredMessages from "./StarredMessages";
import { useState, useEffect, useRef } from "react";
import Tasks from "./Tasks";

const getLastMessagePreview = (message) => {
  if (!message) return "No messages yet";

  if (message.deletedForEveryone) {
    return (
      <span className="flex items-center gap-1">
        <FaBan />
        This message was deleted
      </span>
    );
  }

  if (message.text?.trim()) {
    return message.text;
  }

  if (message.sharedPost) {
    return (
      <span className="flex items-center gap-1">
        <FaShareSquare />
        Shared a post
      </span>
    );
  }

  if (message.messageType === "call") {
    if (message.callType === "missed") {
      return (
        <span className="flex items-center gap-1">
          <FaVideoSlash />
          Missed call
        </span>
      );
    }

    if (message.callType === "video") {
      return (
        <span className="flex items-center gap-1">
          <FaVideo />
          Video call
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1">
        <FaPhone />
        Voice call
      </span>
    );
  }

  if (
    message.location?.latitude &&
    message.location?.longitude
  ) {
    return (
      <span className="flex items-center gap-1">
        <FaMapMarkerAlt />
        Location
      </span>
    );
  }

  if (message.attachments?.length > 0) {
    const attachment = message.attachments[0];

    if (attachment.type === "image") {
      return (
        <span className="flex items-center gap-1">
          <FaImage />
          Photo
        </span>
      );
    }

    if (attachment.type === "video") {
      return (
        <span className="flex items-center gap-1">
          <FaVideo />
          Video
        </span>
      );
    }

    if (attachment.type === "audio") {
      return (
        <span className="flex items-center gap-1">
          <FaMicrophone />
          Voice message
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1">
        <FaFileAlt />
        Document
      </span>
    );
  }

  if (message.audio) {
    return (
      <span className="flex items-center gap-1">
        <FaMicrophone />
        Voice message
      </span>
    );
  }

  return "Message";
};

function ChatSidebar({
  chats,
  loading,
  onlineUsers,
  onChatsDeleted,
}) {
  const { chatId } = useParams();
  const [showStarred, setShowStarred] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
const [pendingTaskCount, setPendingTaskCount] = useState(0);
const [search, setSearch] = useState("");

const [selectedChats, setSelectedChats] = useState([]);
const [isSelectionMode, setIsSelectionMode] = useState(false);

const longPressTimerRef = useRef(null);
const didLongPressRef = useRef(false);


const startChatSelection = (chatId) => {
  setIsSelectionMode(true);

  setSelectedChats((prev) =>
    prev.includes(chatId)
      ? prev
      : [...prev, chatId]
  );
};

const toggleChatSelection = (chatId) => {
  setSelectedChats((prev) => {
    const updated = prev.includes(chatId)
      ? prev.filter((id) => id !== chatId)
      : [...prev, chatId];

    // Last selected chat deselect केला
    if (updated.length === 0) {
      setIsSelectionMode(false);
    }

    return updated;
  });
};

const cancelChatSelection = () => {
  setSelectedChats([]);
  setIsSelectionMode(false);
};

const deleteSelectedChats = async () => {
  if (selectedChats.length === 0) return;

  try {
    await Promise.all(
      selectedChats.map((selectedChatId) =>
        api.delete(`/chat/${selectedChatId}/me`)
      )
    );

    // Clear each deleted chat's cached messages
    selectedChats.forEach((selectedChatId) => {
      localStorage.removeItem(
        `chitchat_messages_${selectedChatId}`
      );
    });

    const deletedIds = [...selectedChats];

setSelectedChats([]);
setIsSelectionMode(false);

// Instantly remove deleted chats from sidebar
onChatsDeleted?.(deletedIds);
  } catch (error) {
    console.error("DELETE CHATS ERROR:", error);
  }
};

const handleChatTouchStart = (chatId) => {
  didLongPressRef.current = false;

  longPressTimerRef.current = setTimeout(() => {
    didLongPressRef.current = true;

    startChatSelection(chatId);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);
};

const cancelChatLongPress = () => {
  if (longPressTimerRef.current) {
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }
};
useEffect(() => {
  const fetchPendingTasks = async () => {
    try {
      const { data } = await api.get("/tasks");

      if (data.success) {
        const pendingCount = (data.tasks || []).filter(
          (task) => !task.completed
        ).length;

        setPendingTaskCount(pendingCount);
      }
    } catch (error) {
      console.error("Failed to fetch pending tasks:", error);
    }
  };

  fetchPendingTasks();
}, []);

  const filteredChats = chats.filter((chat) => {
  const name = chat.otherUser?.name?.toLowerCase() || "";
  const username = chat.otherUser?.username?.toLowerCase() || "";
  const query = search.toLowerCase().trim();

  return (
    name.includes(query) ||
    username.includes(query)
  );
});

if (loading) {
  return (
      <div className="w-full h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto transition-colors">
{isSelectionMode ? (
  <div
    className="
      h-16 px-4
      flex items-center justify-between
      border-b border-gray-200 dark:border-gray-700
      bg-white dark:bg-gray-900
    "
  >
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={cancelChatSelection}
        className="
          text-xl
          text-gray-700 dark:text-gray-200
          hover:text-red-500
        "
      >
        ✕
      </button>

      <span className="font-semibold text-gray-900 dark:text-white">
        {selectedChats.length} selected
      </span>
    </div>

    <button
      type="button"
      onClick={deleteSelectedChats}
      disabled={selectedChats.length === 0}
      className="
        p-2 rounded-full
        text-red-500
        hover:bg-red-50
        dark:hover:bg-red-950/40
        disabled:opacity-40
      "
      title="Delete selected chats"
    >
      <FaTrash size={18} />
    </button>
  </div>
) : (
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
  Messages
</h2>

<div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search chats..."
    className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

        {/* TASKS */}
  <button
  onClick={() => setShowTasks(true)}
  title="Tasks"
  className="relative w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400"
>
  <FaTasks size={16} />

  {pendingTaskCount > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
    </span>
  )}
</button>

  {/* STARRED */}
  <button
    onClick={() => setShowStarred(true)}
    title="Starred Messages"
    className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-yellow-500"
  >
    <FaStar size={16} />
  </button>
      </div>
)}
      <StarredMessages
        isOpen={showStarred}
        onClose={() => setShowStarred(false)}
      />
      <Tasks
  isOpen={showTasks}
  onClose={() => setShowTasks(false)}
  onPendingCountChange={setPendingTaskCount}
/>

      {filteredChats.length === 0 ? (
       <div className="p-5 text-gray-500 dark:text-gray-400">
  {search ? "No chats found." : "No chats yet."}
</div>
      ) : (
        filteredChats.map((chat) => (
         <Link
  key={chat._id}
  to={`/chat/${chat._id}`}

  // 💻 Desktop: right click = select
  onContextMenu={(e) => {
    e.preventDefault();
    startChatSelection(chat._id);
  }}

  // 📱 Mobile: long press = select
  onTouchStart={() => {
    handleChatTouchStart(chat._id);
  }}
  onTouchEnd={cancelChatLongPress}
  onTouchMove={cancelChatLongPress}
  onTouchCancel={cancelChatLongPress}

  // Normal click OR selection click
  onClick={(e) => {
    // Long press नंतर generated click ignore
    if (didLongPressRef.current) {
      e.preventDefault();
      didLongPressRef.current = false;
      return;
    }

    // Selection mode चालू असेल तर chat open करू नको
    if (isSelectionMode) {
      e.preventDefault();
      toggleChatSelection(chat._id);
    }
  }}

  className={`
    relative
    flex items-center gap-3 p-4
    hover:bg-gray-100
    dark:hover:bg-gray-800
    transition
    ${
      selectedChats.includes(chat._id)
        ? "bg-blue-100 dark:bg-blue-900/30"
        : chatId === chat._id
        ? "bg-gray-100 dark:bg-gray-800"
        : ""
    }
  `}
>

  {isSelectionMode && (
  <div
    className={`
      w-6 h-6
      shrink-0
      rounded-full
      border-2
      flex items-center justify-center
      transition-all
      ${
        selectedChats.includes(chat._id)
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white dark:bg-gray-800 border-gray-400 text-transparent"
      }
    `}
  >
    ✓
  </div>
)}
            <div className="relative">

            <img
              src={
                chat.otherUser?.profilePic
                || "/default-profile-picture.png"
              }
              alt={chat.otherUser?.name}
              className="w-12 h-12 rounded-full object-cover"
              />

            {onlineUsers.includes(chat.otherUser?._id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
            </div>

            <div className="flex-1 overflow-hidden">

              <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                {chat.otherUser?.name}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
  {getLastMessagePreview(chat.lastMessage)}
</p>

            </div>

            {chat.unreadCount > 0 && (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {chat.unreadCount}
              </div>
            )}

          </Link>
        ))
      )}

    </div>
  );
}

export default ChatSidebar;

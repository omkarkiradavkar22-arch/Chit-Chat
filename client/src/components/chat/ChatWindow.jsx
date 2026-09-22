import { useEffect, useRef, useState } from "react";
import { FaSearch, FaTimes, FaChevronUp, FaChevronDown,
  FaBan,FaTrash,
 } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import TypingIndicator from "./TypingIndicator";
import ChatHeader from "./ChatHeader";


const getMessageCacheKey = (chatId) =>
  `chitchat_messages_${chatId}`;

const getCachedMessages = (chatId) => {
  try {
    return JSON.parse(
      localStorage.getItem(getMessageCacheKey(chatId)) || "[]"
    );
  } catch {
    return [];
  }
};

const saveCachedMessages = (chatId, messages) => {
  try {
    localStorage.setItem(
      getMessageCacheKey(chatId),
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error("MESSAGE CACHE ERROR:", error);
  }
};

function ChatWindow({
  chatId,
  otherUser,
  onlineUsers,
  onChatUpdate,
}) {
  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);

  const [selectedMessages, setSelectedMessages] = useState([]);
const [isSelectionMode, setIsSelectionMode] = useState(false);

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


const longPressTimerRef = useRef(null);

const handleTouchStart = (messageId, isPending) => {
  if (isPending) return;

  longPressTimerRef.current = setTimeout(() => {
    startMessageSelection(messageId);

    // Small vibration on supported phones
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);
};

const cancelLongPress = () => {
  if (longPressTimerRef.current) {
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }
};

const startMessageSelection = (messageId) => {
  setIsSelectionMode(true);
  setSelectedMessages([messageId]);
};

const toggleMessageSelection = (messageId) => {
  setSelectedMessages((prev) =>
    prev.includes(messageId)
      ? prev.filter((id) => id !== messageId)
      : [...prev, messageId]
  );
};

const cancelMessageSelection = () => {
  setIsSelectionMode(false);
  setSelectedMessages([]);
};

const deleteSelectedForMe = async () => {
  if (selectedMessages.length === 0) return;

  try {
    if (selectedMessages.length === 1) {
      await api.delete(
        `/messages/${selectedMessages[0]}/me`
      );
    } else {
      await api.delete(
        `/messages/${chatId}/multiple/me`,
        {
          data: {
            messageIds: selectedMessages,
          },
        }
      );
    }

    setMessages((prev) => {
      const updated = prev.filter(
        (msg) => !selectedMessages.includes(msg._id)
      );

      saveCachedMessages(chatId, updated);

      return updated;
    });

    toast.success(
      selectedMessages.length === 1
        ? "Message deleted for you"
        : `${selectedMessages.length} messages deleted for you`
    );

    setShowDeleteConfirm(false);
    setSelectedMessages([]);
    setIsSelectionMode(false);

    onChatUpdate?.();

  } catch (error) {
    console.error("DELETE FOR ME ERROR:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to delete messages"
    );
  }
};


const deleteSelectedForEveryone = async () => {
  if (selectedMessages.length !== 1) return;

  const messageId = selectedMessages[0];

  try {
    const { data } = await api.delete(
      `/messages/${messageId}/everyone`
    );

    setMessages((prev) => {
      const updated = prev.map((msg) =>
        msg._id === messageId
          ? data.message
          : msg
      );

      saveCachedMessages(chatId, updated);

      return updated;
    });

    toast.success("Message deleted for everyone");

    setShowDeleteConfirm(false);
    setSelectedMessages([]);
    setIsSelectionMode(false);

    onChatUpdate?.();

  } catch (error) {
    console.error(
      "DELETE FOR EVERYONE ERROR:",
      error
    );

    toast.error(
      error.response?.data?.message ||
        "Failed to delete message"
    );
  }
};


  const bottomRef = useRef(null);
  const { socket } = useSocket();
  const [replyMessage, setReplyMessage] =
  useState(null);
  const { user } = useAuth();

  const selectedSingleMessage =
  selectedMessages.length === 1
    ? messages.find(
        (msg) => msg._id === selectedMessages[0]
      )
    : null;

const canDeleteForEveryone =
  selectedMessages.length === 1 &&
  selectedSingleMessage &&
  (
    selectedSingleMessage.sender?._id?.toString() ===
      user?._id?.toString() ||
    selectedSingleMessage.sender?.toString() ===
      user?._id?.toString()
  ) &&
  !selectedSingleMessage.deletedForEveryone;

  const receiverId = otherUser?._id;

  useEffect(() => {
  if (!socket) return;

  socket.on("messagesSeen", ({ chatId: seenChatId }) => {
    if (seenChatId !== chatId) return;

    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        seenBy: [...(msg.seenBy || []), "seen"],
      }))
    );
  });

  return () => {
    socket.off("messagesSeen");
  };
}, [socket, chatId, user?._id, onChatUpdate]);

// Auto update time for disappearing messages
useEffect(() => {
  const interval = setInterval(() => {
    setNow(Date.now());
  }, 1000);

  return () => clearInterval(interval);
}, []);

const [typingUser, setTypingUser] = useState("");

// =========================
// MESSAGE SEARCH
// =========================
const [isSearchOpen, setIsSearchOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [searchIndex, setSearchIndex] = useState(0);
const [searchMatches, setSearchMatches] = useState([]);

// =========================
// AI / NATURAL LANGUAGE SEARCH
// =========================
const [isAISearchOpen, setIsAISearchOpen] = useState(false);

const [aiSearchQuery, setAISearchQuery] = useState("");
const [aiSearchResults, setAiSearchResults] = useState([]);
const [aiSearchLoading, setAiSearchLoading] = useState(false);

const messageRefs = useRef({});

  const getMessages = async () => {
  try {
    const { data } = await api.get(
      `/messages/${chatId}`
    );

    const serverMessages = data.messages || [];

    // Show latest messages from server
    setMessages(serverMessages);

    // Save this chat's messages for offline use
    saveCachedMessages(chatId, serverMessages);

    await refreshChatInfo();

    await api.put(`/messages/${chatId}/seen`);
    onChatUpdate?.();

  } catch (error) {
    console.error("FETCH MESSAGES ERROR:", error);

    // Network / offline error
    if (!navigator.onLine || !error.response) {
      const cachedMessages = getCachedMessages(chatId);

      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      return;
    }

    // Actual backend error
    toast.error(
      error.response?.data?.message ||
        "Failed to load messages"
    );

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (chatId) {
      getMessages();
    }
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
  if (!socket) return;

 socket.on("newMessage", (message) => {
  const messageChatId =
    typeof message.chat === "object"
      ? message.chat._id
      : message.chat;

  if (String(messageChatId) !== String(chatId)) {
    return;
  }

  // Chat is already open, so incoming message is seen immediately
const senderId =
  typeof message.sender === "object"
    ? message.sender?._id
    : message.sender;

if (String(senderId) !== String(user?._id)) {
  api
    .put(`/messages/${chatId}/seen`)
    .then(() => {
      onChatUpdate?.();
    })
    .catch((error) => {
      console.error(
        "MARK MESSAGE AS SEEN ERROR:",
        error
      );
    });
}

  setMessages((prev) => {
    // Prevent exact duplicate real messages
    if (prev.some((msg) => msg._id === message._id)) {
      return prev;
    }

    // First try to match using clientId
    let pendingIndex = -1;

    if (message.clientId) {
      pendingIndex = prev.findIndex(
        (msg) =>
          msg.pending === true &&
          msg.clientId === message.clientId
      );
    }

    // Temporary fallback until backend clientId support is added
    if (pendingIndex === -1) {
      pendingIndex = prev.findIndex((msg) => {
        const pendingSenderId =
          typeof msg.sender === "object"
            ? msg.sender?._id
            : msg.sender;

        const realSenderId =
          typeof message.sender === "object"
            ? message.sender?._id
            : message.sender;

        return (
          msg.pending === true &&
          msg.text === message.text &&
          String(pendingSenderId) === String(realSenderId)
        );
      });
    }

    // Replace pending bubble with real server message
    if (pendingIndex !== -1) {
      const updated = [...prev];

      updated[pendingIndex] = message;

      // IMPORTANT: update offline cache too
      saveCachedMessages(chatId, updated);

      return updated;
    }

    // Normal incoming message
    const updated = [...prev, message];

    // Keep offline history updated
    saveCachedMessages(chatId, updated);

    return updated;
  });
});

  return () => {
    socket.off("newMessage");
  };
}, [socket, chatId]);

useEffect(() => {
  if (!socket) return;

  socket.on("typing", ({ senderId }) => {
    if (senderId !== user._id) {
      setTypingUser("Someone");
    }
  });

  socket.on("stopTyping", () => {
    setTypingUser("");
  });

  return () => {
    socket.off("typing");
    socket.off("stopTyping");
  };
}, [socket, user]);

useEffect(() => {
  if (!socket) return;

  const handleMessageDeleted = (updatedMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === updatedMessage._id
          ? updatedMessage
          : msg
      )
    );
  };

  socket.on("messageDeleted", handleMessageDeleted);

  return () => {
    socket.off("messageDeleted", handleMessageDeleted);
  };
}, [socket]);


// =========================
// LIVE LOCATION SOCKET EVENTS
// =========================
useEffect(() => {
  if (!socket) return;

  const handleLiveLocationStarted = ({
    chatId: liveChatId,
    latitude,
    longitude,
  }) => {
    if (liveChatId !== chatId) return;

    console.log("📍 Live location started:", latitude, longitude);

    setLiveLocation({
      active: true,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });
  };

  const handleLiveLocationUpdate = ({
    chatId: liveChatId,
    latitude,
    longitude,
  }) => {
    if (liveChatId !== chatId) return;

    console.log(
      "📍 Live location update:",
      latitude,
      longitude
    );

    setLiveLocation({
      active: true,
      latitude,
      longitude,
    });
  };

  const handleLiveLocationStopped = ({
    chatId: liveChatId,
  }) => {
    if (liveChatId !== chatId) return;

    console.log("📍 Live location stopped");

    setLiveLocation(null);
  };

  socket.on(
    "liveLocationStarted",
    handleLiveLocationStarted
  );

  socket.on(
    "liveLocationUpdate",
    handleLiveLocationUpdate
  );

  socket.on(
    "liveLocationStopped",
    handleLiveLocationStopped
  );

  return () => {
    socket.off(
      "liveLocationStarted",
      handleLiveLocationStarted
    );

    socket.off(
      "liveLocationUpdate",
      handleLiveLocationUpdate
    );

    socket.off(
      "liveLocationStopped",
      handleLiveLocationStopped
    );
  };
}, [socket, chatId]);


  const handleMessageSent = (newMessage) => {
  setMessages((prev) => {
    // Same real message already exists
    if (
      newMessage._id &&
      prev.some((msg) => msg._id === newMessage._id)
    ) {
      return prev;
    }

    // If real server message has same clientId,
    // replace its pending version
    if (newMessage.clientId) {
      const pendingIndex = prev.findIndex(
        (msg) =>
          msg.pending === true &&
          msg.clientId === newMessage.clientId
      );

      if (pendingIndex !== -1) {
        const updated = [...prev];
        updated[pendingIndex] = newMessage;

        saveCachedMessages(chatId, updated);

        return updated;
      }
    }

    const updated = [...prev, newMessage];

    // Save pending/normal message in offline history
    saveCachedMessages(chatId, updated);

    return updated;
  });
  onChatUpdate?.();
};

  // =========================
// SEARCH MESSAGES
// =========================

useEffect(() => {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    setSearchMatches([]);
    setSearchIndex(0);
    return;
  }

 const matches = messages.filter((message) => {
  // 1. Search normal text messages
  const textMatch = message.text
    ?.toLowerCase()
    .includes(query);

  if (textMatch) return true;

  // 2. Search attachment filename + URL
  const attachmentMatch = message.attachments?.some((file) => {
    const fileName =
      file.originalName?.toLowerCase() || "";

    const fileUrl =
      file.url?.toLowerCase() || "";

    return (
      fileName.includes(query) ||
      fileUrl.includes(query)
    );
  });

  return attachmentMatch;
});

  setSearchMatches(matches);
  setSearchIndex(0);
}, [searchQuery, messages]);

useEffect(() => {
  if (!searchMatches.length) return;

  const message = searchMatches[searchIndex];

  if (!message) return;

  const element = messageRefs.current[message._id];

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [searchIndex, searchMatches]);

if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat to start messaging.
      </div>
    );
  }
  
const goToNextMatch = () => {
  if (!searchMatches.length) return;

  setSearchIndex((prev) =>
    prev === searchMatches.length - 1
      ? 0
      : prev + 1
  );
};

const goToPreviousMatch = () => {
  if (!searchMatches.length) return;

  setSearchIndex((prev) =>
    prev === 0
      ? searchMatches.length - 1
      : prev - 1
  );
};

const closeSearch = () => {
  setIsSearchOpen(false);
  setSearchQuery("");
  setSearchMatches([]);
  setSearchIndex(0);
};

const handleAISearch = async (e) => {
  e.preventDefault();

  if (!aiSearchQuery.trim()) {
    toast.error("Please enter what you want to search");
    return;
  }

  try {
    setAiSearchLoading(true);   // ✅

    const { data } = await api.post(
      `/messages/${chatId}/ai-search`,
      {
        query: aiSearchQuery,
      }
    );

    setAiSearchResults(data.messages || []);

  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "AI search failed"
    );
  } finally {
    setAiSearchLoading(false);  // ✅
  }
};

const handleUnsendPending = (pendingMessage) => {
  try {
    const queue = JSON.parse(
      localStorage.getItem("chitchat_offline_messages") || "[]"
    );

    const updatedQueue = queue.filter((item) => {
      if (
        pendingMessage.clientId &&
        item.clientId === pendingMessage.clientId
      ) {
        return false;
      }

      if (
        pendingMessage._id &&
        item._id === pendingMessage._id
      ) {
        return false;
      }

      return true;
    });

    localStorage.setItem(
      "chitchat_offline_messages",
      JSON.stringify(updatedQueue)
    );

    setMessages((prev) =>
      prev.filter((msg) => {
        if (
          pendingMessage.clientId &&
          msg.clientId === pendingMessage.clientId
        ) {
          return false;
        }

        return msg._id !== pendingMessage._id;
      })
    );

    toast.success("Message unsent");
  } catch (error) {
    console.error("Unsend pending message error:", error);
    toast.error("Failed to unsend message");
  }
};

  const refreshChatInfo = async () => {
  const chatRes = await api.get("/chat");

  const currentChat = chatRes.data.chats.find(
    (c) => c._id === chatId
  );

  setChatInfo(currentChat);
};

const getMessageDateLabel = (date) => {
  const messageDate = new Date(date);

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (date1, date2) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  if (isSameDay(messageDate, today)) {
    return "TODAY";
  }

  if (isSameDay(messageDate, yesterday)) {
    return "YESTERDAY";
  }

  return messageDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// =========================
// DISAPPEARING MESSAGES
// =========================
const visibleMessages = messages.filter((message) => {
  if (!message.expiresAt) {
    return true;
  }

  return new Date(message.expiresAt).getTime() > now;
});

return (

  <div className="
    flex flex-col flex-1 min-w-0 w-full min-h-0 overflow-hidden
    h-[calc(100dvh-144px)]
    lg:h-full
    bg-gray-100 dark:bg-gray-950
    transition-colors
  ">

    {/* =========================
        DELETE CONFIRMATION MODAL
    ========================= */}
    {showDeleteConfirm && (
      <div
        className="
          fixed inset-0
          z-[9999]
          bg-black/50
          flex items-center justify-center
          p-4
        "
        onClick={() => setShowDeleteConfirm(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="
            w-full max-w-[400px]
            bg-white dark:bg-[#202124]
            text-gray-900 dark:text-white
            rounded-3xl
            shadow-2xl
            p-6
          "
        >
          <h2 className="text-xl font-semibold mb-6">
            {selectedMessages.length === 1
              ? "Delete message?"
              : "Delete messages?"}
          </h2>

          {selectedMessages.length === 1 ? (
            <div className="space-y-3">

             {canDeleteForEveryone && (
  <button
    type="button"
    onClick={deleteSelectedForEveryone}
    className="
      w-full
      py-3 px-4
      rounded-full
      border border-gray-300 dark:border-gray-600
      text-red-500
      font-semibold
      hover:bg-gray-100
      dark:hover:bg-gray-700
      transition
    "
  >
    Delete for everyone
  </button>
)}

              <button
                type="button"
                onClick={deleteSelectedForMe}
                className="
                  w-full
                  py-3 px-4
                  rounded-full
                  border border-gray-300 dark:border-gray-600
                  text-blue-500
                  font-semibold
                  hover:bg-gray-100
                  dark:hover:bg-gray-700
                  transition
                "
              >
                Delete for me
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="
                  w-full
                  py-3
                  text-green-500
                  font-semibold
                  hover:bg-gray-100
                  dark:hover:bg-gray-700
                  rounded-full
                  transition
                "
              >
                Cancel
              </button>

            </div>
          ) : (
            <div>

              <div className="flex justify-end gap-3 mt-8">

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="
                    px-6 py-3
                    rounded-full
                    border border-gray-300 dark:border-gray-600
                    font-semibold
                    hover:bg-gray-100
                    dark:hover:bg-gray-700
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={deleteSelectedForMe}
                  className="
                    px-6 py-3
                    rounded-full
                    bg-blue-500
                    hover:bg-blue-600
                    text-black
                    font-semibold
                    transition
                  "
                >
                  Delete for me
                </button>

              </div>

            </div>
          )}
        </div>
      </div>
    )}

    {/* EXISTING SELECTION HEADER */}
    {isSelectionMode ? (
      <div
        className="
          h-16
          px-4
          flex items-center justify-between
          bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-700
      shrink-0
    "
  >
    <div className="flex items-center gap-4">

      <button
        type="button"
        onClick={cancelMessageSelection}
        className="
          text-xl
          text-gray-700 dark:text-gray-200
          hover:text-red-500
        "
        title="Cancel selection"
      >
        ✕
      </button>

      <span className="font-semibold text-gray-900 dark:text-white">
        {selectedMessages.length} selected
      </span>

    </div>

    <button
      type="button"
      onClick={() => setShowDeleteConfirm(true)}
      disabled={selectedMessages.length === 0}
      className="
        p-2
        text-red-500
        hover:bg-red-50
        dark:hover:bg-red-950/40
        rounded-full
        disabled:opacity-40
      "
      title="Delete selected messages"
    >
      <FaTrash size={18} />
    </button>
  </div>
) : (
  <ChatHeader
    otherUser={otherUser}
    onlineUsers={onlineUsers}
    chatInfo={chatInfo}
    setChatInfo={setChatInfo}
    chatId={chatId}
    refreshChatInfo={refreshChatInfo}
    setIsSearchOpen={setIsSearchOpen}
    setIsAISearchOpen={setIsAISearchOpen}
  />
)}

{isAISearchOpen && (
  <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">

    <form
      onSubmit={handleAISearch}
      className="flex items-center gap-2"
    >

      <div className="flex-1 relative">

        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          ✨
        </span>

        <input
          autoFocus
          type="text"
          value={aiSearchQuery}
          onChange={(e) =>
            setAISearchQuery(e.target.value)
          }
          placeholder="Ask anything... e.g. What did we talk about college tomorrow?"
          className="
            w-full
            border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder-gray-400
            rounded-xl
            pl-10 pr-4 py-3
            outline-none
            focus:ring-2
            focus:ring-purple-500
          "
        />

      </div>

      <button
        type="submit"
        disabled={aiSearchLoading}
        className="
          bg-purple-600
          hover:bg-purple-700
          text-white
          px-5 py-3
          rounded-xl
          transition
          disabled:opacity-50
        "
      >
        {aiSearchLoading ? "Searching..." : "Search"}
      </button>

      <button
        type="button"
        onClick={() => {
          setIsAISearchOpen(false);
          setAiSearchQuery("");
          setAiSearchResults([]);
        }}
        className="
          px-3 py-3
          rounded-xl
          hover:bg-gray-100
          dark:hover:bg-gray-800
        "
      >
        ✕
      </button>

    </form>

    {/* AI SEARCH RESULTS */}
    {aiSearchResults.length > 0 && (
      <div className="mt-4 space-y-2">

        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          ✨ Found {aiSearchResults.length} relevant messages
        </p>

        {aiSearchResults.map((message) => (
          <div
            key={message._id}
            className="
              p-3
              rounded-xl
              bg-gray-50 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
            "
          >
            <p className="text-sm text-gray-900 dark:text-white">
              {message.text}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              {new Date(
                message.createdAt
              ).toLocaleString()}
            </p>
          </div>
        ))}

      </div>
    )}

    {!aiSearchLoading &&
      aiSearchQuery.trim() &&
      aiSearchResults.length === 0 && (
        <p className="text-sm text-gray-500 mt-3">
          No relevant messages found.
        </p>
      )}

  </div>
)}


{/* =========================
    MESSAGE SEARCH
========================= */}

{isSearchOpen && (
 <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2 transition-colors">
    {/* Search input */}
    <div className="flex-1 relative">

      <FaSearch
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={14}
      />

      <input
        autoFocus
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search messages..."
        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />

    </div>

    {/* Result count */}
    <span className="text-xs text-gray-500 min-w-[45px] text-center">
      {searchQuery.trim()
        ? searchMatches.length
          ? `${searchIndex + 1}/${searchMatches.length}`
          : "0"
        : ""}
    </span>

    {/* Previous */}
    <button
      type="button"
      onClick={goToPreviousMatch}
      disabled={!searchMatches.length}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
      title="Previous"
    >
      <FaChevronUp />
    </button>

    {/* Next */}
    <button
      type="button"
      onClick={goToNextMatch}
      disabled={!searchMatches.length}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
      title="Next"
    >
      <FaChevronDown />
    </button>

    {/* Close */}
    <button
      type="button"
      onClick={closeSearch}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
      title="Close search"
    >
      <FaTimes />
    </button>

  </div>
)}

{chatInfo?.pinnedMessage && (
 <div className="bg-yellow-50 dark:bg-yellow-950/40 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        📌 Pinned Message
      </p>

      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
        {chatInfo.pinnedMessage.text}
      </p>
    </div>

    <button
      onClick={async () => {
        await api.post(`/chat/${chatId}/unpin`);

        setChatInfo({
          ...chatInfo,
          pinnedMessage: null,
        });

        toast.success("Message unpinned");
      }}
      className="text-red-500 text-sm"
    >
      Unpin
    </button>

  </div>
)}

{chatInfo?.isBlocked && (
  <div className="bg-red-100 dark:bg-red-950/40 border-b border-red-300 dark:border-red-800 p-3 flex justify-between items-center">

    <span className="text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
      <FaBan/>
      {chatInfo.blockedBy === user._id
        ? " You blocked this user"
        : " You have been blocked"}
    </span>

    {chatInfo.blockedBy === user._id && (
      <button
        onClick={async () => {
          await api.post(`/chat/${chatId}/unblock`);

          setChatInfo({
            ...chatInfo,
            isBlocked: false,
            blockedBy: null,
          });

          toast.success("User unblocked");
        }}
        className="bg-blue-600 text-white px-3 py-1 rounded"
      >
        Unblock
      </button>
    )}

  </div>
)}

      {/* Messages */}

      <div className="flex-1 min-w-0 w-full overflow-y-auto p-5 pb-24 bg-gray-100 dark:bg-gray-950 transition-colors">
        {loading ? (
         <div className="text-center text-gray-700 dark:text-gray-300">
            Loading...
          </div>
        ) : visibleMessages.length === 0 ? (
         <div className="text-center text-gray-500 dark:text-gray-400">
            No messages yet.
          </div>
        ) : (
          visibleMessages.map((message, index) => {
  const matchIndex = searchMatches.findIndex(
    (item) => item._id === message._id
  );

  const currentDateLabel = getMessageDateLabel(
    message.createdAt
  );

  const previousDateLabel =
  index > 0
    ? getMessageDateLabel(
        visibleMessages[index - 1].createdAt
      )
    : null;

  const showDateSeparator =
    currentDateLabel !== previousDateLabel;

  return (
    <div key={message._id}>
      
      {/* DATE SEPARATOR */}
      {showDateSeparator && (
        <div className="flex items-center justify-center my-4">
          <span className="
            bg-gray-200 
            dark:bg-gray-800
            text-gray-600 
            dark:text-gray-300
            text-xs
            font-medium
            px-3
            py-1
            rounded-full
          ">
            {currentDateLabel}
          </span>
        </div>
      )}

      {/* MESSAGE */}
      <div
  ref={(el) => {
    messageRefs.current[message._id] = el;
  }}

  onTouchStart={() => {
  handleTouchStart(message._id, message.pending);
}}

onTouchEnd={cancelLongPress}

onTouchMove={cancelLongPress}

onTouchCancel={cancelLongPress}

  onClick={() => {
    if (isSelectionMode && !message.pending) {
      toggleMessageSelection(message._id);
    }
  }}

  className={`
  relative
  group
  transition-colors
  -mx-5 px-5
  ${
    selectedMessages.includes(message._id)
      ? "bg-blue-100/70 dark:bg-white/10"
      : ""
  }
`}
>

  {isSelectionMode && !message.pending && (
  <div
    className={`
      absolute
      left-5 top-1/2 -translate-y-1/2
      z-20

      w-5 h-5
      rounded-full
      border-2

      flex items-center justify-center
      text-xs font-bold

      transition-all

      ${
       selectedMessages.includes(message._id)
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white dark:bg-gray-800 border-gray-400 text-transparent"
       }
    `}
  >
    ✓
  </div>
)}


        <div
  className={
    isSelectionMode
      ? "pl-9 transition-all"
      : "transition-all"
  }
>
  <MessageBubble
    refreshChatInfo={refreshChatInfo}
          message={message}
          chatId={chatId}
          liveLocation={liveLocation}
          searchQuery={searchQuery}
          onUnsendPending={handleUnsendPending}
          isSearchMatch={
            matchIndex !== -1 &&
            searchMatches[searchIndex]?._id ===
              message._id
          }

          onPin={(updatedChat) => {
            setChatInfo(updatedChat);
          }}

          onSelect={(messageId) => {
  startMessageSelection(messageId);
}}

          onReply={() =>
            setReplyMessage(message)
          }

          onDelete={(id) =>
            setMessages((prev) =>
              prev.filter((msg) => msg._id !== id)
            )
          }

          onEdit={(updatedMessage) =>
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === updatedMessage._id
                  ? updatedMessage
                  : msg
              )
            )
          }

          onReaction={(updatedMessage) =>
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === updatedMessage._id
                  ? updatedMessage
                  : msg
              )
            )
          }
        />
        </div>
      </div>
    </div>
  );
})
        )}

        <div ref={bottomRef} />

      </div>

      <TypingIndicator typingUser={typingUser} />

      {/* Input */}
     

      {!chatInfo?.isBlocked ? (
<MessageInput
    chatId={chatId}
    receiverId={receiverId}
    senderId={user._id}
    replyMessage={replyMessage}
    setReplyMessage={setReplyMessage}
    onMessageSent={handleMessageSent}
/>
) : null}

    </div>
  );
}

export default ChatWindow;

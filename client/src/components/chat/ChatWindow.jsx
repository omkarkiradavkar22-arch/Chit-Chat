import { useEffect, useRef, useState } from "react";
import { FaSearch, FaTimes, FaChevronUp, FaChevronDown } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import TypingIndicator from "./TypingIndicator";
import ChatHeader from "./ChatHeader";

function ChatWindow({
  chatId,
  otherUser,
  onlineUsers,
}) {
  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);

  const bottomRef = useRef(null);
  const { socket } = useSocket();
  const [replyMessage, setReplyMessage] =
  useState(null);
  const { user } = useAuth();
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
}, [socket, chatId]);

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

      setMessages(data.messages);

      await refreshChatInfo();

      await api.put(`/messages/${chatId}/seen`);
    } catch (error) {
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
    if (message.chat === chatId) {
      setMessages((prev) => [...prev, message]);
    }
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


  const handleMessageSent = (message) => {
    setMessages((prev) => [...prev, message]);
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

  const refreshChatInfo = async () => {
  const chatRes = await api.get("/chat");

  const currentChat = chatRes.data.chats.find(
    (c) => c._id === chatId
  );

  setChatInfo(currentChat);
};

  return (

    
<div className="flex flex-col flex-1 h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950 transition-colors">
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

    <span className="text-red-700 dark:text-red-300 font-medium">
      {chatInfo.blockedBy === user._id
        ? "🚫 You blocked this user"
        : "🚫 You have been blocked"}
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

       <div className="flex-1 overflow-y-auto p-5 bg-gray-100 dark:bg-gray-950 transition-colors">

        {loading ? (
         <div className="text-center text-gray-700 dark:text-gray-300">
            Loading...
          </div>
        ) : messages.length === 0 ? (
         <div className="text-center text-gray-500 dark:text-gray-400">
            No messages yet.
          </div>
        ) : (
          messages.map((message) => {
  const matchIndex = searchMatches.findIndex(
    (item) => item._id === message._id
  );

  return (
    <div
      key={message._id}
      ref={(el) => {
        messageRefs.current[message._id] = el;
      }}
    >
      <MessageBubble
        refreshChatInfo={refreshChatInfo}
        message={message}
        chatId={chatId}
        liveLocation={liveLocation}

        searchQuery={searchQuery}

        isSearchMatch={
          matchIndex !== -1 &&
          searchMatches[searchIndex]?._id === message._id
        }

        onPin={(updatedChat) => {
          setChatInfo(updatedChat);
        }}

        onReply={() => setReplyMessage(message)}

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
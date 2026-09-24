import { useEffect, useRef, useState } from "react";
import {
  FaSearch,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
  FaBan,
  FaTrash,
  FaLocationArrow,
  FaMapMarkedAlt,
  FaExternalLinkAlt,
  FaStar,
FaCopy,
FaShare,
FaEllipsisV,
FaTasks,
FaEdit,
} from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ForwardModal from "./ForwardModal";
import LiveLocationViewer from "./LiveLocationViewer";
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
  const [myLiveLocation, setMyLiveLocation] = useState(null);
  const [showLiveLocationViewer, setShowLiveLocationViewer] =
  useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
const [isSelectionMode, setIsSelectionMode] = useState(false);

const [messageAttachmentCacheState, setMessageAttachmentCacheState] =
  useState({});

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

const [showSelectionMenu, setShowSelectionMenu] =
  useState(false);

  const [showSelectionForward, setShowSelectionForward] =
  useState(false);

const [selectionForwardMessageId, setSelectionForwardMessageId] =
  useState(null);

const [editRequestedMessageId, setEditRequestedMessageId] =
  useState(null);

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
  setShowSelectionMenu(false);
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

  const selectedMessageObjects = messages.filter((msg) =>
  selectedMessages.includes(msg._id)
);

const isPureTextMessage = (msg) => {
  if (!msg) return false;

  const hasText = Boolean(msg.text?.trim());
  const hasAttachments = (msg.attachments?.length || 0) > 0;
  const hasLocation =
    msg.location?.latitude != null &&
    msg.location?.longitude != null;
  const hasSharedPost = Boolean(msg.sharedPost);

  return (
    hasText &&
    !hasAttachments &&
    !hasLocation &&
    !hasSharedPost
  );
};

const selectedTextMessages =
  selectedMessageObjects.filter(isPureTextMessage);

const selectedNonTextMessages =
  selectedMessageObjects.filter(
    (msg) => !isPureTextMessage(msg)
  );

// ========================================
// MESSAGE SELECTION HELPERS
// ========================================

// 1. SINGLE TEXT SELECTION
const isSingleTextSelection =
  selectedMessages.length === 1 &&
  selectedTextMessages.length === 1 &&
  !selectedSingleMessage?.deletedForEveryone;


// 2. SELECTED MESSAGE SENDER
const selectedSingleSenderId =
  typeof selectedSingleMessage?.sender === "object"
    ? selectedSingleMessage?.sender?._id
    : selectedSingleMessage?.sender;


// 3. CAN EDIT SELECTED MESSAGE
const canEditSelectedMessage =
  isSingleTextSelection &&
  selectedSingleMessage &&
  String(selectedSingleSenderId) === String(user?._id) &&
  !selectedSingleMessage.deletedForEveryone;


// ========================================
// RESTRICTED MESSAGE HELPERS
// ========================================

// 4. DELETED MESSAGE
const isDeletedMessage = (msg) => {
  return Boolean(msg?.deletedForEveryone);
};


// 5. NOT DOWNLOADED / UNAVAILABLE ATTACHMENT
const isNotDownloadedAttachment = (msg) => {
  if (!msg?.attachments?.length) {
    return false;
  }

  const senderId =
    typeof msg.sender === "object"
      ? msg.sender?._id
      : msg.sender;

  // Own sent attachments are already available to sender
  if (String(senderId) === String(user?._id)) {
    return false;
  }

  const cacheState =
    messageAttachmentCacheState[msg._id] || {};

  return msg.attachments.some(
    (file) => cacheState[file.url] !== true
  );
};


// 6. RESTRICTED MESSAGE
const isRestrictedSelectionMessage = (msg) => {
  if (!msg) return true;

  return (
    isDeletedMessage(msg) ||
    isNotDownloadedAttachment(msg)
  );
};


// 7. SINGLE RESTRICTED SELECTION
const isSingleRestrictedSelection =
  selectedMessages.length === 1 &&
  selectedSingleMessage &&
  isRestrictedSelectionMessage(
    selectedSingleMessage
  );


// ========================================
// PHOTO HELPERS
// ========================================

// 8. CHECK PHOTO MESSAGE
const isPhotoMessage = (msg) => {
  if (!msg) return false;

  const attachments = msg.attachments || [];

  const hasOnlyImages =
    attachments.length > 0 &&
    attachments.every(
      (file) => file.type === "image"
    );

  const hasLocation =
    msg.location?.latitude != null &&
    msg.location?.longitude != null;

  const hasSharedPost =
    Boolean(msg.sharedPost);

  return (
    hasOnlyImages &&
    !hasLocation &&
    !hasSharedPost
  );
};


// 9. TEXT OR PHOTO
const isTextOrPhotoMessage = (msg) => {
  if (isRestrictedSelectionMessage(msg)) {
    return false;
  }

  return (
    isPureTextMessage(msg) ||
    isPhotoMessage(msg)
  );
};


// ========================================
// SINGLE NON-TEXT SELECTION
// ========================================

// 10. SINGLE PHOTO / VIDEO / FILE / LOCATION ETC.
const isSingleNonTextSelection =
  selectedMessages.length === 1 &&
  selectedNonTextMessages.length === 1 &&
  !isSingleRestrictedSelection;


// ========================================
// MULTIPLE SELECTION
// ========================================

// 11. MULTIPLE TEXT / PHOTO
const isMultipleTextPhotoSelection =
  selectedMessages.length > 1 &&
  selectedMessageObjects.length > 0 &&
  selectedMessageObjects.every(
    (msg) =>
      !isRestrictedSelectionMessage(msg) &&
      isTextOrPhotoMessage(msg)
  );


// 12. MULTIPLE RESTRICTED / UNSUPPORTED
const isMultipleRestrictedSelection =
  selectedMessages.length > 1 &&
  selectedMessageObjects.some(
    (msg) =>
      isRestrictedSelectionMessage(msg) ||
      !isTextOrPhotoMessage(msg)
  );

// ========================================
// MOBILE SELECTION ACTIONS
// ========================================

const handleSelectedEdit = () => {
  if (!canEditSelectedMessage || !selectedSingleMessage) {
    return;
  }

  setEditRequestedMessageId(
    selectedSingleMessage._id
  );

  cancelMessageSelection();
};

const handleSelectedCopy = async () => {
  try {
    const textToCopy = selectedMessageObjects
      .filter((msg) => msg.text?.trim())
      .map((msg) => msg.text.trim())
      .join("\n");

    if (!textToCopy) {
      toast.error("No text to copy");
      return;
    }

    await navigator.clipboard.writeText(textToCopy);

    toast.success("Copied");
  } catch (error) {
    console.error("Copy selected messages error:", error);
    toast.error("Failed to copy");
  }
};


const handleSelectedAddTask = async () => {
  if (!isSingleTextSelection || !selectedSingleMessage) {
    return;
  }

  try {
    await api.post("/tasks", {
      chat: chatId,
      message: selectedSingleMessage._id,
      title: selectedSingleMessage.text,
      deadline: null,
    });

    toast.success("✅ Task created successfully");

    setSelectedMessages([]);
  } catch (error) {
    console.error("Create task error:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to create task"
    );
  }
};

const handleSelectedStar = async () => {
  if (selectedMessageObjects.length === 0) {
    return;
  }

  try {
    const updatedMessages = [...messages];

    for (const selectedMessage of selectedMessageObjects) {
      const { data } = await api.post(
        `/messages/${selectedMessage._id}/star`
      );

      const messageIndex = updatedMessages.findIndex(
        (msg) => msg._id === selectedMessage._id
      );

      if (messageIndex !== -1) {
        const currentMessage =
          updatedMessages[messageIndex];

        updatedMessages[messageIndex] = {
          ...currentMessage,

          starredBy: data.starred
            ? [
                ...(currentMessage.starredBy || []).filter(
                  (id) =>
                    id?.toString() !==
                    user?._id?.toString()
                ),
                user._id,
              ]
            : (currentMessage.starredBy || []).filter(
                (id) =>
                  id?.toString() !==
                  user?._id?.toString()
              ),
        };
      }
    }

    setMessages(updatedMessages);

    toast.success(
      selectedMessageObjects.length === 1
        ? "Message star updated"
        : "Messages star updated"
    );

    cancelMessageSelection();
  } catch (error) {
    console.error(
      "Star selected messages error:",
      error
    );

    toast.error("Failed to star message");
  }
};

const handleSelectedPin = async () => {
  if (
    !isSingleTextSelection ||
    !selectedSingleMessage
  ) {
    return;
  }

  try {
    await api.post(
      `/chat/${chatId}/pin/${selectedSingleMessage._id}`
    );

    await refreshChatInfo();

    toast.success("Message pinned");

    cancelMessageSelection();
  } catch (error) {
    console.error(
      "Pin selected message error:",
      error
    );

    toast.error("Failed to pin");
  }
};

const handleSelectedShare = () => {
  if (selectedMessageObjects.length === 0) {
    return;
  }

  // Single message
  if (selectedMessageObjects.length === 1) {
    setSelectionForwardMessageId(
      selectedMessageObjects[0]._id
    );
  } else {
    // Multiple messages use messageIds in ForwardModal
    setSelectionForwardMessageId(null);
  }

  setShowSelectionForward(true);
  setShowSelectionMenu(false);
};

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

// =========================
// REAL-TIME MESSAGE EDIT
// =========================

useEffect(() => {
  if (!socket) return;

  const handleMessageEdited = (updatedMessage) => {
    if (!updatedMessage?._id) return;

    const messageChatId =
      typeof updatedMessage.chat === "object"
        ? updatedMessage.chat?._id
        : updatedMessage.chat;

    // Ignore edits from another chat
    if (
      String(messageChatId) !==
      String(chatId)
    ) {
      return;
    }

    setMessages((prev) => {
      const updated = prev.map((msg) =>
        String(msg._id) ===
        String(updatedMessage._id)
          ? {
              ...msg,
              ...updatedMessage,

              // Preserve sender if backend response
              // ever does not contain it
              sender:
                updatedMessage.sender ||
                msg.sender,
            }
          : msg
      );

      saveCachedMessages(
        chatId,
        updated
      );

      return updated;
    });
  };

  socket.on(
    "messageEdited",
    handleMessageEdited
  );

  return () => {
    socket.off(
      "messageEdited",
      handleMessageEdited
    );
  };
}, [socket, chatId]);

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
// REAL-TIME MESSAGE REACTION
// =========================

useEffect(() => {
  if (!socket) return;

  const handleReactionUpdated = (updatedMessage) => {
    if (!updatedMessage?._id) return;

    setMessages((prev) => {
      const updated = prev.map((msg) =>
        String(msg._id) === String(updatedMessage._id)
          ? {
              ...msg,
              reactions: updatedMessage.reactions || [],
            }
          : msg
      );

      // Offline cache सुद्धा update
      saveCachedMessages(chatId, updated);

      return updated;
    });
  };

  socket.on(
    "messageReactionUpdated",
    handleReactionUpdated
  );

  return () => {
    socket.off(
      "messageReactionUpdated",
      handleReactionUpdated
    );
  };
}, [socket, chatId]);

// =========================
// LIVE LOCATION SOCKET EVENTS
// =========================
useEffect(() => {
  if (!socket) return;

  const handleLiveLocationStarted = ({
  chatId: liveChatId,
  senderId,
  latitude,
  longitude,
}) => {
  if (String(liveChatId) !== String(chatId)) return;

  if (String(senderId) === String(user?._id)) {
    setMyLiveLocation({
      active: true,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });
  } else {
    setLiveLocation({
      active: true,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });
  }
};

  const handleLiveLocationUpdate = ({
  chatId: liveChatId,
  senderId,
  latitude,
  longitude,
}) => {
  if (String(liveChatId) !== String(chatId)) return;

  if (String(senderId) === String(user?._id)) {
    setMyLiveLocation({
      active: true,
      latitude,
      longitude,
    });
  } else {
    setLiveLocation({
      active: true,
      latitude,
      longitude,
    });
  }
};

 const handleLiveLocationStopped = ({
  chatId: liveChatId,
  senderId,
}) => {
  if (String(liveChatId) !== String(chatId)) return;

  // My live location stopped
  if (String(senderId) === String(user?._id)) {
    setMyLiveLocation(null);

    // Other user is also not sharing
    if (!liveLocation?.active) {
      setShowLiveLocationViewer(false);
    }

    return;
  }

  // Other user's live location stopped
  setLiveLocation(null);

  // I am also not sharing
  if (!myLiveLocation?.active) {
    setShowLiveLocationViewer(false);
  }
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

const displayedLiveLocation =
  liveLocation?.active
    ? liveLocation
    : myLiveLocation?.active
    ? myLiveLocation
    : null;

return (

  <div className="
    flex flex-col flex-1 min-w-0 w-full min-h-0 overflow-hidden
    h-[calc(100dvh-144px)]
    lg:h-full
    bg-gray-100 dark:bg-gray-950
    transition-colors
  ">

    {/* =========================
    LIVE LOCATION VIEWER
========================= */}

{showLiveLocationViewer &&
  (myLiveLocation?.active ||
    liveLocation?.active) && (

    <LiveLocationViewer
      myLiveLocation={myLiveLocation}
      otherLiveLocation={liveLocation}

      currentUser={user}
      otherUser={otherUser}

      onClose={() =>
        setShowLiveLocationViewer(false)
      }
    />
)}

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
{/* MOBILE MESSAGE SELECTION HEADER */}
{isSelectionMode ? (
  <div
    className="
      h-16
      px-3
      flex items-center
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-700
      shrink-0
      relative
    "
  >
    {/* CANCEL + COUNT */}
    <div className="flex items-center gap-3 min-w-0">
      <button
        type="button"
        onClick={cancelMessageSelection}
        className="
          p-2
          text-gray-700 dark:text-gray-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          rounded-full
        "
        title="Cancel selection"
      >
        <FaTimes size={19} />
      </button>

      <span
        className="
          font-semibold
          text-gray-900 dark:text-white
          min-w-[22px]
        "
      >
        {selectedMessages.length}
      </span>
    </div>


    {/* ACTIONS */}
    <div className="ml-auto flex items-center gap-1">

      {/* ================================= */}
      {/* SINGLE TEXT MESSAGE */}
      {/* Star | Add Task | Delete | Share | Menu */}
      {/* ================================= */}

      {isSingleTextSelection && (
        <>
          <button
            type="button"
            onClick={handleSelectedStar}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Star"
          >
            <FaStar size={18} />
          </button>

          <button
            type="button"
            onClick={handleSelectedAddTask}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Add Task"
          >
            <FaTasks size={18} />
          </button>

          {canEditSelectedMessage && (
  <button
    type="button"
    onClick={handleSelectedEdit}
    className="
      p-2.5
      rounded-full
      text-gray-700 dark:text-gray-200
      hover:bg-gray-100 dark:hover:bg-gray-800
    "
    title="Edit"
  >
    <FaEdit size={18} />
  </button>
)}

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="
              p-2.5
              rounded-full
              text-red-500
              hover:bg-red-50
              dark:hover:bg-red-950/40
            "
            title="Delete"
          >
            <FaTrash size={18} />
          </button>

          <button
            type="button"
            onClick={handleSelectedShare}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Share"
          >
            <FaShare size={18} />
          </button>


          {/* THREE DOT MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowSelectionMenu((prev) => !prev)
              }
              className="
                p-2.5
                rounded-full
                text-gray-700 dark:text-gray-200
                hover:bg-gray-100 dark:hover:bg-gray-800
              "
              title="More"
            >
              <FaEllipsisV size={18} />
            </button>


            {showSelectionMenu && (
              <div
                className="
                  absolute
                  right-0
                  top-11
                  z-[200]
                  w-40
                  py-1
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-xl
                  shadow-xl
                  overflow-hidden
                "
              >
                <button
                  type="button"
                  onClick={() => {
                    handleSelectedCopy();
                    setShowSelectionMenu(false);
                  }}
                  className="
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-sm
                    text-left
                    text-gray-800 dark:text-gray-100
                    hover:bg-gray-100 dark:hover:bg-gray-700
                  "
                >
                  <FaCopy size={16} />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSelectionMenu(false);
                    handleSelectedPin();
                  }}
                  className="
                    w-full
                    flex items-center gap-3
                    px-4 py-3
                    text-sm
                    text-left
                    text-gray-800 dark:text-gray-100
                    hover:bg-gray-100 dark:hover:bg-gray-700
                  "
                >
                  <span className="text-base">📌</span>
                  Pin
                </button>
              </div>
            )}
          </div>
        </>
      )}


      {/* ================================= */}
      {/* SINGLE PHOTO / FILE / LOCATION ETC */}
      {/* Delete | Share */}
      {/* ================================= */}

      {isSingleNonTextSelection && (
        <>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="
              p-2.5
              rounded-full
              text-red-500
              hover:bg-red-50
              dark:hover:bg-red-950/40
            "
            title="Delete"
          >
            <FaTrash size={18} />
          </button>

          <button
            type="button"
            onClick={handleSelectedShare}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Share"
          >
            <FaShare size={18} />
          </button>
        </>
      )}


      {/* ================================= */}
{/* SINGLE RESTRICTED MESSAGE */}
{/* Deleted / unavailable → Delete only */}
{/* ================================= */}

{isSingleRestrictedSelection && (
  <button
    type="button"
    onClick={() => setShowDeleteConfirm(true)}
    className="
      p-2.5
      rounded-full
      text-red-500
      hover:bg-red-50
      dark:hover:bg-red-950/40
    "
    title="Delete"
  >
    <FaTrash size={18} />
  </button>
)}


      {/* ================================= */}
      {/* MULTIPLE TEXT / PHOTO */}
      {/* Star | Delete | Copy | Share */}
      {/* ================================= */}

      {isMultipleTextPhotoSelection && (
        <>
          <button
            type="button"
            onClick={handleSelectedStar}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Star"
          >
            <FaStar size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="
              p-2.5
              rounded-full
              text-red-500
              hover:bg-red-50
              dark:hover:bg-red-950/40
            "
            title="Delete"
          >
            <FaTrash size={18} />
          </button>

          <button
            type="button"
            onClick={handleSelectedCopy}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Copy"
          >
            <FaCopy size={18} />
          </button>

          <button
            type="button"
            onClick={handleSelectedShare}
            className="
              p-2.5
              rounded-full
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
            "
            title="Share"
          >
            <FaShare size={18} />
          </button>
        </>
      )}


      {/* ================================= */}
      {/* MULTIPLE WITH FILE / LOCATION ETC */}
      {/* DELETE ONLY */}
      {/* ================================= */}

      {isMultipleRestrictedSelection && (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="
            p-2.5
            rounded-full
            text-red-500
            hover:bg-red-50
            dark:hover:bg-red-950/40
          "
          title="Delete"
        >
          <FaTrash size={18} />
        </button>
      )}

    </div>
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

          onAttachmentCacheStateChange={(
  messageId,
  fileUrl,
  isCached
) => {
  setMessageAttachmentCacheState((prev) => ({
    ...prev,
    [messageId]: {
      ...(prev[messageId] || {}),
      [fileUrl]: isCached,
    },
  }));
}}
          chatId={chatId}
          liveLocation={liveLocation}
           editRequestedMessageId={editRequestedMessageId}

  onEditRequestHandled={() => {
    setEditRequestedMessageId(null);
  }}
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

      {/* =========================
    LIVE LOCATION CARD
========================= */}

{displayedLiveLocation?.active &&
  displayedLiveLocation?.latitude != null &&
  displayedLiveLocation?.longitude != null && (
    <div className="flex justify-start mb-4">
      <div
        className="
          w-[290px]
          max-w-full
          overflow-hidden
          rounded-2xl
          border
          border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800
          shadow-sm
        "
      >
        {/* HEADER */}
        <div className="p-4">
          <div className="flex items-center gap-3">

            {/* LOCATION ICON */}
            <div
              className="
                w-11 h-11
                rounded-full
                bg-green-100 dark:bg-green-500/15
                flex items-center justify-center
                shrink-0
              "
            >
              <FaLocationArrow
                size={19}
                className="text-green-500"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">

                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-900 dark:text-white
                  "
                >
                  Live Location
                </p>

                <span
                  className="
                    bg-green-500
                    text-white
                    text-[10px]
                    font-bold
                    px-2 py-0.5
                    rounded-full
                  "
                >
                  LIVE
                </span>

              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="
                    w-2 h-2
                    rounded-full
                    bg-green-500
                    animate-pulse
                  "
                />

                <span
                  className="
                    text-xs
                    text-gray-500 dark:text-gray-300
                  "
                >
                  Sharing live location
                </span>
              </div>
            </div>
          </div>

          {/* COORDINATES */}
          <div
            className="
              mt-3
              px-3 py-2.5
              rounded-xl
              bg-gray-100 dark:bg-gray-700
              border
              border-gray-200 dark:border-gray-600
            "
          >
            <div className="flex items-center gap-2">

              <FaMapMarkedAlt
                size={14}
                className="text-green-500 shrink-0"
              />

              <p
                className="
                  text-xs
                  text-gray-700 dark:text-gray-200
                "
              >
                {Number(displayedLiveLocation.latitude).toFixed(5)}
                {", "}
                {Number(displayedLiveLocation.longitude).toFixed(5)}
              </p>

            </div>
          </div>
        </div>

        {/* VIEW LIVE LOCATION */}
        <button
          type="button"
          onClick={() => {
  setShowLiveLocationViewer(true);
}}
          className="
            w-full
            flex items-center
            justify-center
            gap-2
            px-4 py-3

            border-t
            border-gray-200 dark:border-gray-700

            text-green-600 dark:text-green-400
            text-sm
            font-semibold

            hover:bg-gray-50
            dark:hover:bg-gray-700/60

            transition
          "
        >
          <FaMapMarkedAlt size={15} />

          <span>View Live Location</span>

          <FaExternalLinkAlt size={10} />
        </button>
      </div>
    </div>
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

  onLiveLocationStart={(location) => {
    setMyLiveLocation(location);
  }}

  onLiveLocationUpdate={(location) => {
    setMyLiveLocation(location);
  }}

  onLiveLocationStop={() => {
    setMyLiveLocation(null);

    // Other user पण share करत नसेल
    // तर viewer close करा.
    if (!liveLocation?.active) {
      setShowLiveLocationViewer(false);
    }
  }}
/>
) : null}

<ForwardModal
  open={showSelectionForward}
  onClose={() => {
    setShowSelectionForward(false);
    setSelectionForwardMessageId(null);
    cancelMessageSelection();
  }}
  messageId={selectionForwardMessageId}
  messageIds={
    selectedMessages.length > 1
      ? selectedMessages
      : []
  }
/>

    </div>
  );
}

export default ChatWindow;

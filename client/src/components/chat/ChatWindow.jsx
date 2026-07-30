import { useEffect, useRef, useState } from "react";
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

  const handleMessageSent = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat to start messaging.
      </div>
    );
  }

  const refreshChatInfo = async () => {
  const chatRes = await api.get("/chat");

  const currentChat = chatRes.data.chats.find(
    (c) => c._id === chatId
  );

  setChatInfo(currentChat);
};

  return (

    
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)] bg-gray-100">

       <ChatHeader
  otherUser={otherUser}
  onlineUsers={onlineUsers}
  chatInfo={chatInfo}
  setChatInfo={setChatInfo}
  chatId={chatId}
  refreshChatInfo={refreshChatInfo}
/>

{chatInfo?.pinnedMessage && (
  <div className="bg-yellow-50 border-b px-4 py-2 flex items-center justify-between">

    <div>
      <p className="text-xs text-gray-500">
        📌 Pinned Message
      </p>

      <p className="text-sm font-medium truncate">
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
  <div className="bg-red-100 border-b border-red-300 p-3 flex justify-between items-center">

    <span className="text-red-700 font-medium">
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

      <div className="flex-1 overflow-y-auto p-5">

        {loading ? (
          <div className="text-center">
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            No messages yet.
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
  refreshChatInfo={refreshChatInfo}
  key={message._id}
  message={message} 
  chatId={chatId}
  onPin={(updatedChat)=>{
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
          ))
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

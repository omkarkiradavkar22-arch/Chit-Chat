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

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)] bg-gray-100">

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
  key={message._id}
  message={message}
  onReply={() => setReplyMessage(message)}
/>
          ))
        )}

        <div ref={bottomRef} />

      </div>

      <TypingIndicator typingUser={typingUser} />

      {/* Input */}
      <ChatHeader
    otherUser={otherUser}
    onlineUsers={onlineUsers}
/>

      <MessageInput
  chatId={chatId}
  receiverId={receiverId}
  senderId={user._id}
  replyMessage={replyMessage}
  setReplyMessage={setReplyMessage}
  onMessageSent={handleMessageSent}
/>

    </div>
  );
}

export default ChatWindow;
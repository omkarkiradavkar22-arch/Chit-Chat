import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { toast } from "react-hot-toast";

import Layout from "../components/layouts/Layout";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";

import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";


const CHAT_LIST_CACHE_KEY = "chitchat_chat_list";

const getCachedChats = () => {
  try {
    return JSON.parse(
      localStorage.getItem(CHAT_LIST_CACHE_KEY) || "[]"
    );
  } catch {
    return [];
  }
};

const saveCachedChats = (chats) => {
  try {
    localStorage.setItem(
      CHAT_LIST_CACHE_KEY,
      JSON.stringify(chats)
    );
  } catch (error) {
    console.error("CHAT CACHE ERROR:", error);
  }
};

function Chat() {
  const { chatId } = useParams();
const navigate = useNavigate();
const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [chats, setChats] = useState(() => getCachedChats());
const [onlineUsers, setOnlineUsers] = useState([]);

  const getChats = async () => {
    try {
      const { data } = await api.get("/chat");

      setChats(data.chats);
      saveCachedChats(data.chats);

    }catch (error) {
  console.error("FETCH CHATS ERROR:", error);

  if (!navigator.onLine || !error.response) {
    const cachedChats = getCachedChats();

    if (cachedChats.length > 0) {
      setChats(cachedChats);
    }

    return;
  }

  toast.error(
    error.response?.data?.message ||
      "Failed to load chats"
  );
} 
  };

  useEffect(() => {
    getChats();
  }, []);

  // Tell the server which chat we currently have open, and clear it on
  // unmount/switch — server uses this to skip push notifications for
  // messages in a chat the user is already actively viewing.
  useEffect(() => {
    if (!socket || !user?._id || !chatId) return;

    socket.emit("joinChat", { userId: user._id, chatId });

    return () => {
      socket.emit("leaveChat", { userId: user._id, chatId });
    };
  }, [socket, user?._id, chatId]);

useEffect(() => {
  if (!socket) return;

  // =========================
  // ONLINE USERS
  // =========================
  const handleOnlineUsers = (users) => {
    setOnlineUsers(users);
  };

  // =========================
  // NEW MESSAGE
  // =========================
  const handleNewMessage = (message) => {
    const messageChatId =
      typeof message.chat === "object"
        ? message.chat?._id
        : message.chat;

    // Sidebar preview instantly update
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (
          String(chat._id) !==
          String(messageChatId)
        ) {
          return chat;
        }

        return {
          ...chat,

          // latest message immediately
          lastMessage: message,
        };
      });

      saveCachedChats(updatedChats);

      return updatedChats;
    });

    // Sync unread count + latest server data
    getChats();
  };

  // =========================
  // SEEN STATUS
  // =========================
  const handleMessagesSeen = () => {
    // Refresh unread counts
    getChats();
  };

  socket.on(
    "onlineUsers",
    handleOnlineUsers
  );

  socket.on(
    "newMessage",
    handleNewMessage
  );

  socket.on(
    "messagesSeen",
    handleMessagesSeen
  );

  return () => {
    socket.off(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.off(
      "newMessage",
      handleNewMessage
    );

    socket.off(
      "messagesSeen",
      handleMessagesSeen
    );
  };
}, [socket]);

 const handleChatsDeleted = (deletedChatIds) => {
  setChats((prevChats) => {
    const updatedChats = prevChats.filter(
      (chat) => !deletedChatIds.includes(chat._id)
    );

    saveCachedChats(updatedChats);

    return updatedChats;
  });

  // Currently open chat delete केला असेल
  if (chatId && deletedChatIds.includes(chatId)) {
    navigate("/chat");
  }
};

  const selectedChat =
    chats.find((chat) => chat._id === chatId) || null;

    const fallbackOtherUser =
  location.state?.otherUser || null;

const activeOtherUser =
  selectedChat?.otherUser || fallbackOtherUser;

  return (
    <Layout fullScreen>
      <div className="flex w-full h-full min-h-0 bg-white dark:bg-gray-900 md:rounded-2xl md:shadow overflow-hidden transition-colors">
        {/* CHAT SIDEBAR */}
        <div
          className={`
            w-full lg:w-[360px] shrink-0
            ${chatId ? "hidden lg:block" : "block"}
          `}
        >
          <ChatSidebar
  chats={chats}
  onlineUsers={onlineUsers}
  onChatsDeleted={handleChatsDeleted}
/>
        </div>

        {/* CHAT WINDOW */}
        <div
          className={`
            min-w-0 flex-1
            ${chatId ? "block" : "hidden lg:block"}
          `}
        >
         {chatId && activeOtherUser ? (
  <ChatWindow
    key={chatId}
    chatId={chatId}
    otherUser={activeOtherUser}
    onlineUsers={onlineUsers}
    onChatUpdate={getChats}
  />
) : (
  <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">
    Select a chat
  </div>
)}
        </div>
      </div>
    </Layout>
  );
}

export default Chat;
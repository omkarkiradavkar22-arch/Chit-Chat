import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import Layout from "../components/layouts/Layout";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";

import api from "../services/api";
import { useSocket } from "../context/SocketContext";

function Chat() {
  const { chatId } = useParams();

  const { socket } = useSocket();

  const [chats, setChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getChats = async () => {
    try {
      const { data } = await api.get("/chat");

      setChats(data.chats);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load chats"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getChats();
  }, []);

 

  useEffect(() => {
  if (!socket) return;

  socket.on("onlineUsers", (users) => {
    setOnlineUsers(users);
  });

  socket.on("newMessage", () => {
    getChats();
  });

  socket.on("messagesSeen", () => {
    getChats();
  });

  return () => {
    socket.off("onlineUsers");
    socket.off("newMessage");
    socket.off("messagesSeen");
  };
}, [socket]);

  const selectedChat =
    chats.find((chat) => chat._id === chatId) || null;

  return (
  <Layout>
    <div className="flex h-[calc(100dvh-80px)] bg-white dark:bg-gray-900 md:rounded-2xl md:shadow overflow-hidden transition-colors">

      {/* CHAT SIDEBAR */}
      <div
        className={`
          w-full lg:w-[360px] shrink-0
          ${chatId ? "hidden lg:block" : "block"}
        `}
      >
        <ChatSidebar
          chats={chats}
          loading={loading}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* CHAT WINDOW */}
      <div
        className={`
          min-w-0 flex-1
          ${chatId ? "block" : "hidden lg:block"}
        `}
      >
        <ChatWindow
          chatId={chatId}
          otherUser={selectedChat?.otherUser}
          onlineUsers={onlineUsers}
        />
      </div>

    </div>
  </Layout>
);
}

export default Chat;
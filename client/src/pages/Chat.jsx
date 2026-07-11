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

    return () => {
      socket.off("onlineUsers");
    };
  }, [socket]);

  const selectedChat =
    chats.find((chat) => chat._id === chatId) || null;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl shadow overflow-hidden">

        <ChatSidebar
  chats={chats}
  loading={loading}
  onlineUsers={onlineUsers}
/>

        <ChatWindow
          chatId={chatId}
          otherUser={selectedChat?.otherUser}
          onlineUsers={onlineUsers}
        />

      </div>
    </Layout>
  );
}

export default Chat;
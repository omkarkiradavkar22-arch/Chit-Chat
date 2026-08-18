import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);

useEffect(() => {
    if (!user) return;

    console.log("🧩 [SocketContext] Creating socket for user:", {
      userId: user._id,
      userIdType: typeof user._id,
      apiUrl: import.meta.env.VITE_API_URL,
    });

    const SOCKET_URL = new URL(import.meta.env.VITE_API_URL).origin;

    console.log("🔌 [SocketContext] Connecting socket to origin:", SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("🟢 [SocketContext] Socket connected:", newSocket.id);

      newSocket.emit("join", user._id);

      console.log("🚪 [SocketContext] Emitted join for room:", user._id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("🔴 [SocketContext] connect_error:", err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("🟡 [SocketContext] Socket disconnected:", reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
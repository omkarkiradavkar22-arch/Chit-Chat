import { Server } from "socket.io";
import User from "../models/User.js";

let io;
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);

    socket.on("join", (userId) => {
      onlineUsers.set(userId, socket.id);

      socket.join(userId);

      // Broadcast updated online users
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      console.log(`${userId} joined`);
    });

    socket.on("typing", ({ receiverId, senderId }) => {
  io.to(receiverId).emit("typing", {
    senderId,
  });
});

socket.on("stopTyping", ({ receiverId, senderId }) => {
  io.to(receiverId).emit("stopTyping", {
    senderId,
  });
});

    socket.on("disconnect", async () => {
  for (const [userId, socketId] of onlineUsers.entries()) {
    if (socketId === socket.id) {
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
      });

      break;
    }
  }

  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  console.log("🔴 User Disconnected:", socket.id);
});
  });

  return io;
};

export { io, onlineUsers };
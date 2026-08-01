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

      onlineUsers.set(userId, socket.id);

      socket.join(userId);

      console.log("🚪 [SERVER] join received:", {
        userId,
        userIdType: typeof userId,
        socketId: socket.id,
      });

        console.log(
    "🏠 ROOMS:",
    [...socket.rooms]
  );

      console.log(
        "👥 [SERVER] onlineUsers map now:",
        Array.from(onlineUsers.entries())
      );
  
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

// =========================
// AUDIO/VIDEO CALL SIGNALING
// (server just relays messages between the two users' rooms —
// all actual call logic/WebRTC lives on the frontend)
// =========================

socket.on("call:invite", ({ to, from, fromName, fromPic, offer, callType }) => {
  const targetRoom = io.sockets.adapter.rooms.get(to);

  console.log("📞 [SERVER] call:invite received:", {
    to,
    toType: typeof to,
    from,
    fromName,
    hasOffer: !!offer,
  });
  console.log(
    "📞 [SERVER] target room members for",
    to,
    ":",
    targetRoom ? [...targetRoom] : "❌ ROOM DOES NOT EXIST"
  );

  io.to(to).emit("call:invite", { from, fromName, fromPic, offer, callType });

  console.log("📞 [SERVER] call:invite emitted to room:", to);
});

socket.on("call:accept", ({ to, answer }) => {
  io.to(to).emit("call:accept", { answer });
});

socket.on("call:reject", ({ to }) => {
  io.to(to).emit("call:reject");
});

socket.on("call:end", ({ to }) => {
  io.to(to).emit("call:end");
});

socket.on("call:ice-candidate", ({ to, candidate }) => {
  io.to(to).emit("call:ice-candidate", { candidate });
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

socket.on("startLiveLocation", ({ chatId, receiverId }) => {
  socket.join(`liveLocation:${chatId}`);

  socket.to(receiverId).emit("liveLocationStarted", {
    chatId,
  });
});

socket.on(
  "liveLocationUpdate",
  ({ chatId, receiverId, latitude, longitude }) => {
    socket.to(receiverId).emit("liveLocationUpdate", {
      chatId,
      latitude,
      longitude,
    });
  }
);

socket.on("stopLiveLocation", ({ chatId, receiverId }) => {
  socket.leave(`liveLocation:${chatId}`);

  socket.to(receiverId).emit("liveLocationStopped", {
    chatId,
  });
});


  });

  return io;
};

export { io, onlineUsers };

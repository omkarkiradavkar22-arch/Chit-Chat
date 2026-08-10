import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
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
// AUDIO / VIDEO CALL SIGNALING
// =========================

// 📞 CALL INVITE
socket.on(
  "call:invite",
  async ({
    to,
    from,
    fromName,
    fromPic,
    offer,
    callType,
    chatId,
  }) => {
    try {
      console.log("📞 [SERVER] Call invite:", {
        from,
        to,
        chatId,
        callType,
      });

      // Send incoming call to receiver
      io.to(to).emit("call:invite", {
        from,
        fromName,
        fromPic,
        offer,
        callType,
        chatId,
      });

      // 🔔 Create incoming call notification
      if (chatId) {
        await Notification.create({
  sender: from,
  receiver: to,
  type: "incoming_call",
  priority: "normal",
  status: "pending",
  chat: chatId,
});
      }

      console.log("🔔 Incoming call notification created");

    } catch (error) {
      console.error("CALL INVITE ERROR:", error);
    }
  }
);


// ✅ CALL ACCEPT
socket.on(
  "call:accept",
  async ({
    to,
    answer,
    chatId,
    from,
    callType,
  }) => {
    try {

      // Send answer back to caller
      io.to(to).emit("call:accept", {
        answer,
      });

      console.log("📞 Call accepted:", {
        to,
        from,
        chatId,
        callType,
      });

    } catch (error) {
      console.error("CALL ACCEPT ERROR:", error);
    }
  }
);


// ❌ CALL REJECT
socket.on(
  "call:reject",
  async ({
    to,
    chatId,
    from,
    callType,
  }) => {
    try {
      io.to(to).emit("call:reject");

      console.log("📵 Legacy call reject:", {
        to,
        from,
        chatId,
        callType,
      });
    } catch (error) {
      console.error("CALL REJECT ERROR:", error);
    }
  }
);


// 📞 CALL END
socket.on(
  "call:end",
  async ({
    to,
    from,
    chatId,
    callType,
    callDuration = 0,
    wasAnswered = false,
  }) => {
    try {
      console.log("📞 [SERVER] Call ended:", {
        from,
        to,
        chatId,
        callType,
        callDuration,
        wasAnswered,
      });

      // Close call overlay on other user's side
      io.to(to).emit("call:end");

      if (!chatId || !from || !to) return;

      // =====================================================
      // MISSED / UNANSWERED CALL
      // =====================================================

      if (!wasAnswered) {

  const callerMissedMessage = await Message.create({
    chat: chatId,
    sender: from,
    text: "",
    messageType: "call",
    callType: "missed",
    callDuration: 0,
  });

  const receiverMissedMessage = await Message.create({
    chat: chatId,
    sender: to,
    text: "",
    messageType: "call",
    callType: "missed",
    callDuration: 0,
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: receiverMissedMessage._id,
  });

  await Notification.deleteMany({
    sender: from,
    receiver: to,
    type: "incoming_call",
    status: "pending",
  });

  // Only receiver gets Missed Call notification
  await Notification.create({
    sender: from,
    receiver: to,
    type: "missed_call",
    priority: "important",
    status: "missed",
    chat: chatId,
  });

  io.to(from).emit("newMessage", callerMissedMessage);
  io.to(to).emit("newMessage", receiverMissedMessage);

  console.log("📵 Receiver got missed call notification");

  return;
}

      // =====================================================
      // COMPLETED CALL
      // =====================================================

      const outgoingMessage = await Message.create({
        chat: chatId,
        sender: from,
        text: "",
        messageType: "call",
        callType: "outgoing",
        callDuration,
      });

      const incomingMessage = await Message.create({
        chat: chatId,
        sender: to,
        text: "",
        messageType: "call",
        callType: "incoming",
        callDuration,
      });

      // ---------------------------------------------
      // Update last message
      // ---------------------------------------------

      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: incomingMessage._id,
      });

      // ---------------------------------------------
      // Remove pending incoming-call notification
      // ---------------------------------------------

      await Notification.deleteMany({
        sender: from,
        receiver: to,
        type: "incoming_call",
        status: "pending",
      });

      // ---------------------------------------------
      // Send completed call messages
      // ---------------------------------------------

      io.to(from).emit(
        "newMessage",
        outgoingMessage
      );

      io.to(to).emit(
        "newMessage",
        incomingMessage
      );

      console.log(
        "📞 COMPLETED CALL MESSAGES CREATED"
      );

    } catch (error) {
      console.error(
        "CALL END ERROR:",
        error
      );
    }
  }
);


// ICE CANDIDATE
socket.on("call:ice-candidate", ({ to, candidate }) => {
  io.to(to).emit("call:ice-candidate", {
    candidate,
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
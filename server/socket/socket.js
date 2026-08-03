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


// ❌ CALL REJECT / MISSED CALL
socket.on(
  "call:reject",
  async ({
    to,
    chatId,
    from,
    callType,
  }) => {
    try {

      // Tell caller that call was rejected
      io.to(to).emit("call:reject");

      console.log("📵 Call rejected:", {
        to,
        from,
        chatId,
        callType,
      });

      if (!chatId || !from || !to) return;

      // --------------------------------
      // Create CALL message for caller
      // --------------------------------
      const callerMessage = await Message.create({
        chat: chatId,
        sender: to,
        text: "",
        messageType: "call",
        callType: "outgoing",
      });

      // --------------------------------
      // Create CALL message for receiver
      // --------------------------------
      const receiverMessage = await Message.create({
        chat: chatId,
        sender: from,
        text: "",
        messageType: "call",
        callType: "missed",
      });

      // Update last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: receiverMessage._id,
      });

      // 🔔 Missed call notification
      await Notification.create({
        sender: to,
        receiver: from,
        type: "missed_call",
        priority: "normal",
        status: "rejected",
      });

      // Send messages to both users
      io.to(to).emit("newMessage", callerMessage);
      io.to(from).emit("newMessage", receiverMessage);

      console.log("📵 Missed call message + notification created");

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
  }) => {
    try {

      // Tell other user to end call
      io.to(to).emit("call:end");

      console.log("📞 Call ended:", {
        from,
        to,
        chatId,
        callType,
        callDuration,
      });

      if (!chatId || !from || !to) return;

      // --------------------------------
      // Message for person who started call
      // --------------------------------
      const outgoingMessage = await Message.create({
        chat: chatId,
        sender: from,
        text: "",
        messageType: "call",
        callType: "outgoing",
        callDuration,
      });

      // --------------------------------
      // Message for other person
      // --------------------------------
      const incomingMessage = await Message.create({
        chat: chatId,
        sender: to,
        text: "",
        messageType: "call",
        callType: "incoming",
        callDuration,
      });

      // Update chat last message
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: incomingMessage._id,
      });

      // Send messages to both users
      io.to(from).emit("newMessage", outgoingMessage);
      io.to(to).emit("newMessage", incomingMessage);

      console.log("📞 Completed call messages created");

    } catch (error) {
      console.error("CALL END ERROR:", error);
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
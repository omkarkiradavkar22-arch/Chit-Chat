import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import PendingCall from "../models/PendingCall.js";
import { sendPushToUser } from "../services/webPush.js";
let io;
const onlineUsers = new Map();
// userId -> { with: otherUserId, chatId, callType }
const activeCalls = new Map();
// userId -> chatId currently open on screen (null/absent = none)
const activeChats = new Map();

export const getActiveChat = (userId) => activeChats.get(userId?.toString());

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

    // Client tells us which chat screen it currently has open, so we
    // can skip sending a push notification for messages in that chat
    // (the user already sees them live via socket).
    socket.on("joinChat", ({ userId, chatId }) => {
      if (userId && chatId) {
        activeChats.set(userId.toString(), chatId.toString());
      }
    });

    socket.on("leaveChat", ({ userId, chatId }) => {
      if (userId && activeChats.get(userId.toString()) === chatId?.toString()) {
        activeChats.delete(userId.toString());
      }
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

          // Remove old ringing pending call for this receiver
await PendingCall.deleteMany({
  receiver: to,
  status: "ringing",
});

// Save WebRTC offer temporarily
const pendingCall = await PendingCall.create({
  caller: from,
  receiver: to,
  chat: chatId,
  callType: callType || "audio",
  offer,
  status: "ringing",
  expiresAt: new Date(Date.now() + 60 * 1000),
});

console.log("📞 Pending call saved:", pendingCall._id);

          // 🔔 Push so the callee is alerted even if the app/tab is
          // closed. Note: this can only show a tappable "Incoming call"
          // notification, not a true ringing/full-screen call UI like a
          // native VoIP app — that needs OS-level CallKit/ConnectionService
          // integration that a web app can't do.
          await sendPushToUser(to, {
  type: "incoming_call",

  callId: pendingCall._id.toString(),

  callerId: from,
  callerName: fromName || "Someone",
  callerPic: fromPic || "",

  callType: callType || "audio",
  chatId: chatId || "",

  title: `${fromName || "Someone"} is calling`,

  body:
    callType === "video"
      ? "Incoming video call"
      : "Incoming audio call",

  url: chatId
    ? `/chat/${chatId}`
    : "/",

  tag: chatId
    ? `incoming-call-${chatId}`
    : `incoming-call-${from}`,
});
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
          await PendingCall.findOneAndUpdate(
  {
    caller: to,
    receiver: from,
    chat: chatId,
    status: "ringing",
  },
  {
    status: "accepted",
  }
);

          // Send answer back to caller
          io.to(to).emit("call:accept", {
            answer,
          });

          // Track both sides so we can end the call if either disconnects
          activeCalls.set(from, { with: to, chatId, callType });
          activeCalls.set(to, { with: from, chatId, callType });

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
    callId,
  }) => {
        try {
          if (callId) {
  await PendingCall.findOneAndUpdate(
    {
      _id: callId,
      status: "ringing",
    },
    {
      status: "declined",
    }
  );
} else {
  await PendingCall.findOneAndUpdate(
    {
      caller: to,
      receiver: from,
      chat: chatId,
      status: "ringing",
    },
    {
      status: "declined",
    }
  );
}

await Notification.deleteMany({
  sender: to,
  receiver: from,
  type: "incoming_call",
  status: "pending",
});
          io.to(to).emit("call:reject");

          // Previously nothing was saved here, so a rejected/busy call
          // never showed up in chat history the way a missed call does.
          const rejectedMessage = await Message.create({
            chat: chatId,
            sender: from,
            text: "",
            messageType: "call",
            callType: "rejected",
            callDuration: 0,
          });

          await Chat.findByIdAndUpdate(chatId, {
            lastMessage: rejectedMessage._id,
          });

          io.to(to).emit("newMessage", rejectedMessage);
          io.to(from).emit("newMessage", rejectedMessage);

          activeCalls.delete(from);
          activeCalls.delete(to);

          console.log("📵 Call rejected:", {
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

          activeCalls.delete(from);
          activeCalls.delete(to);

          if (!chatId || !from || !to) return;

          // =====================================================
          // MISSED / UNANSWERED CALL
          // =====================================================

          if (!wasAnswered) {

        const pendingCall = await PendingCall.findOneAndUpdate(
  {
    caller: from,
    receiver: to,
    chat: chatId,
    status: "ringing",
  },
  {
    status: "missed",
  },
  {
    new: true,
    sort: { createdAt: -1 },
  }
);

if (!pendingCall) {
  console.log(
    "⚠️ No ringing pending call found. Missed call already handled."
  );
  return;
}
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

            const caller = await User.findById(from).select(
  "name profilePic"
);

await sendPushToUser(to, {
  type: "missed_call",

  callerId: from,
  callerName: caller?.name || "Someone",
  callerPic: caller?.profilePic || "",

  callType: callType || "audio",
  chatId,

  title: `Missed call from ${caller?.name || "Someone"}`,
  body:
    callType === "video"
      ? "Missed video call"
      : "Missed audio call",

  url: `/chat/${chatId}`,

  tag: `missed-call-${chatId}`,
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
      let disconnectedUserId = null;

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          disconnectedUserId = userId;

          await User.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });

          break;
        }
      }

      // 📞 If this user was mid-call, end it for the other participant too —
      // otherwise their UI stays stuck on "connected" forever.
      if (disconnectedUserId && activeCalls.has(disconnectedUserId)) {
        const { with: otherUserId, chatId, callType } = activeCalls.get(
          disconnectedUserId
        );

        io.to(otherUserId).emit("call:end", { reason: "disconnected" });

        try {
          const droppedMessage = await Message.create({
            chat: chatId,
            sender: disconnectedUserId,
            text: "",
            messageType: "call",
            callType: "ended",
            callDuration: 0,
          });

          await Chat.findByIdAndUpdate(chatId, {
            lastMessage: droppedMessage._id,
          });

          io.to(otherUserId).emit("newMessage", droppedMessage);
        } catch (err) {
          console.error("CALL DISCONNECT CLEANUP ERROR:", err);
        }

        activeCalls.delete(disconnectedUserId);
        activeCalls.delete(otherUserId);

        console.log("📵 Ended call due to disconnect:", {
          disconnectedUserId,
          otherUserId,
          callType,
        });
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

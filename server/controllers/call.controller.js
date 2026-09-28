import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import PendingCall from "../models/PendingCall.js";

// =====================================================
// ❌ DECLINE PENDING CALL
// =====================================================

export const declineCall = async (req, res) => {
  try {
    const {
      callerId,
      chatId,
      callType = "audio",
    } = req.body;

    const receiverId = req.user._id;

    if (!callerId || !chatId) {
      return res.status(400).json({
        success: false,
        message: "callerId and chatId are required",
      });
    }

    // Mark latest ringing call as declined
    const pendingCall = await PendingCall.findOneAndUpdate(
      {
        caller: callerId,
        receiver: receiverId,
        chat: chatId,
        status: "ringing",
      },
      {
        status: "declined",
      },
      {
        new: true,
        sort: { createdAt: -1 },
      }
    );

    if (!pendingCall) {
      return res.status(404).json({
        success: false,
        message: "Pending call not found or already handled",
      });
    }

    // Remove pending incoming-call notification
    await Notification.deleteMany({
      sender: callerId,
      receiver: receiverId,
      type: "incoming_call",
      status: "pending",
    });

    // Save rejected call in chat history
    const rejectedMessage = await Message.create({
      chat: chatId,
      sender: callerId,
      text: "",
      messageType: "call",
      callType: "rejected",
      callDuration: 0,
    });

    // Update chat last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: rejectedMessage._id,
    });

    return res.status(200).json({
      success: true,
      message: "Call declined",
    });
  } catch (error) {
    console.error("DECLINE CALL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// 📞 GET CURRENT PENDING CALL
// =====================================================

export const getPendingCall = async (req, res) => {
  try {
    const receiverId = req.user._id;

    // Actual call should only remain answerable for 30 seconds.
    // PendingCall document itself can stay longer for cleanup/safety.
    const thirtySecondsAgo = new Date(
      Date.now() - 30 * 1000
    );

    const pendingCall = await PendingCall.findOne({
      receiver: receiverId,
      status: "ringing",

      // Prevent old/stale calls from being restored
      createdAt: {
        $gt: thirtySecondsAgo,
      },

      expiresAt: {
        $gt: new Date(),
      },
    })
      .sort({
        createdAt: -1,
      })
      .populate(
        "caller",
        "name username profilePic"
      )
      .populate("chat");

    if (!pendingCall) {
      return res.status(404).json({
        success: false,
        message: "No pending call found",
      });
    }

    return res.status(200).json({
      success: true,

      call: {
        callId: pendingCall._id,

        callerId:
          pendingCall.caller._id,

        callerName:
          pendingCall.caller.name,

        callerPic:
          pendingCall.caller.profilePic,

        chatId:
          pendingCall.chat._id,

        callType:
          pendingCall.callType,

        offer:
          pendingCall.offer,
      },
    });
  } catch (error) {
    console.error(
      "GET PENDING CALL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// ✅ ACCEPT PENDING CALL
// =====================================================

export const acceptPendingCall = async (req, res) => {
  try {
    const { callId } = req.body;

    const receiverId = req.user._id;

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: "callId is required",
      });
    }

    // Call is only answerable for 30 seconds
    const thirtySecondsAgo = new Date(
      Date.now() - 30 * 1000
    );

    // IMPORTANT:
    // Match exact callId so another ringing call
    // cannot accidentally be accepted.
    const pendingCall = await PendingCall.findOne({
      _id: callId,

      receiver: receiverId,

      status: "ringing",

      createdAt: {
        $gt: thirtySecondsAgo,
      },

      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!pendingCall) {
      return res.status(404).json({
        success: false,
        message:
          "Pending call not found or expired",
      });
    }

    // Mark call as accepted
    pendingCall.status = "accepted";

    await pendingCall.save();

    // Remove incoming-call notification
    await Notification.deleteMany({
      sender: pendingCall.caller,
      receiver: receiverId,
      type: "incoming_call",
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      message: "Call accepted",
    });
  } catch (error) {
    console.error(
      "ACCEPT PENDING CALL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
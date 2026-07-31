import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

export const createChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    if (currentUserId.toString() === otherUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot chat with yourself",
      });
    }

    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Public account
    if (!otherUser.isPrivate) {
      return await createOrReturnChat(
        currentUserId,
        otherUserId,
        res
      );
    }

    // Private account
    const currentUser = await User.findById(currentUserId);

    const currentFollowsOther = currentUser.following.some(
      (id) => id.toString() === otherUserId
    );

    const otherFollowsCurrent = otherUser.following.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (!currentFollowsOther || !otherFollowsCurrent) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to message this user",
      });
    }

    return await createOrReturnChat(
      currentUserId,
      otherUserId,
      res
    );

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createOrReturnChat = async (
  currentUserId,
  otherUserId,
  res
) => {

  let chat = await Chat.findOne({
    participants: {
      $all: [currentUserId, otherUserId],
    },
  });

  if (chat) {
    return res.status(200).json({
      success: true,
      chat,
    });
  }

  chat = await Chat.create({
    participants: [currentUserId, otherUserId],
  });

  res.status(201).json({
    success: true,
    chat,
  });
};

export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate("participants", "name username profilePic isOnline lastSeen")
      .populate({
  path: "lastMessage",
  populate: {
    path: "sender",
    select: "name username profilePic",
  },
})
.populate({
  path: "pinnedMessage",
  populate: {
    path: "sender",
    select: "name username",
  },
})
      .sort({ updatedAt: -1 });

    const formattedChats = await Promise.all(
  chats.map(async (chat) => {
    const otherUser = chat.participants.find(
      (user) => user._id.toString() !== req.user._id.toString()
    );

    const unreadCount = await Message.countDocuments({
      chat: chat._id,
      sender: { $ne: req.user._id },
      seenBy: { $ne: req.user._id },
      deletedForEveryone: false,
    });

    return {
  _id: chat._id,
  otherUser,
  lastMessage: chat.lastMessage,
  unreadCount,
  updatedAt: chat.updatedAt,

  isBlocked: chat.isBlocked,
  blockedBy: chat.blockedBy,
  pinnedMessage: chat.pinnedMessage,
  disappearingMessages: chat.disappearingMessages,
};
  })
);

    res.status(200).json({
      success: true,
      count: formattedChats.length,
      chats: formattedChats,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // User must be participant
    if (
      !chat.participants.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const message = await Message.findById(messageId);

    if (!message || message.chat.toString() !== chatId) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    chat.pinnedMessage = message._id;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Message pinned successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (
      !chat.participants.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    chat.pinnedMessage = null;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Message unpinned successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const blockChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (
      !chat.participants.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    chat.isBlocked = true;
    chat.blockedBy = req.user._id;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const unblockChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (
      chat.blockedBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only blocker can unblock"
      });
    }

    chat.isBlocked = false;
    chat.blockedBy = null;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const setDisappearingMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { duration } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check participant
    const isParticipant = chat.participants.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Turn OFF
    if (duration === null || duration === 0) {
      chat.disappearingMessages.enabled = false;
      chat.disappearingMessages.duration = null;

      await chat.save();

      return res.status(200).json({
        success: true,
        message: "Disappearing messages turned off",
        disappearingMessages: chat.disappearingMessages,
      });
    }

    // Allowed durations
    const allowedDurations = [
      24 * 60 * 60,          // 24 hours
      7 * 24 * 60 * 60,      // 7 days
      90 * 24 * 60 * 60,     // 90 days
    ];

    if (!allowedDurations.includes(duration)) {
      return res.status(400).json({
        success: false,
        message: "Invalid disappearing message duration",
      });
    }

    chat.disappearingMessages.enabled = true;
    chat.disappearingMessages.duration = duration;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Disappearing messages updated",
      disappearingMessages: chat.disappearingMessages,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const startLiveLocation = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { latitude, longitude, duration } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // User must be participant
    if (
      !chat.participants.some(
        (id) =>
          id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Duration in seconds
    // Default = 1 hour
    const durationInSeconds =
      Number(duration) || 60 * 60;

    const startedAt = new Date();

    const expiresAt = new Date(
      Date.now() + durationInSeconds * 1000
    );

    chat.liveLocation = {
      active: true,
      sharedBy: req.user._id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      startedAt,
      expiresAt,
    };

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Live location started",
      liveLocation: chat.liveLocation,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const stopLiveLocation = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    if (
      !chat.participants.some(
        (id) =>
          id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Only person who started sharing can stop it
    if (
      chat.liveLocation?.sharedBy?.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the person sharing can stop live location",
      });
    }

    chat.liveLocation.active = false;
    chat.liveLocation.sharedBy = null;
    chat.liveLocation.latitude = null;
    chat.liveLocation.longitude = null;
    chat.liveLocation.startedAt = null;
    chat.liveLocation.expiresAt = null;

    await chat.save();

    res.status(200).json({
      success: true,
      message: "Live location stopped",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

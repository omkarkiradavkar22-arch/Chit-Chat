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
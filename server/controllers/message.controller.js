import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { io } from "../socket/socket.js";

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ChitChat/messages",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const sendMessage = async (req, res) => {
  try {
    const { text, replyTo } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Security: sender must be participant
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

    let image = {};

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    if (!text && !image.url) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const message = await Message.create({
  chat: chat._id,
  sender: req.user._id,
  text,
  image,
  replyTo: replyTo || null,
  delivered: true,
  seenBy: [req.user._id],
});
    chat.lastMessage = message._id;

    await chat.save();
const receiver = chat.participants.find(
  (id) => id.toString() !== req.user._id.toString()
);

const populatedMessage = await Message.findById(message._id)
  .populate("sender", "name username profilePic")
  .populate({
    path: "replyTo",
    populate: {
      path: "sender",
      select: "name username",
    },
  });

if (receiver) {
  io.to(receiver.toString()).emit("newMessage", populatedMessage);
}

res.status(201).json({
  success: true,
  message: populatedMessage,
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Only participants can view messages
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

    const messages = await Message.find({
      chat: chat._id,
      deletedFor: {
        $ne: req.user._id,
      },
      deletedForEveryone: false,
    })
      .populate("sender", "name username profilePic")
.populate({
  path: "replyTo",
  populate: {
    path: "sender",
    select: "name username",
  },
}).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    message.text = text;
    message.isEdited = true;

    await message.save();

    res.status(200).json({
      success: true,
      message,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted for you",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteForEveryone = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only sender can delete for everyone",
      });
    }

    message.deletedForEveryone = true;
    message.text = "";
    message.image = {};

    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted for everyone",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: req.user._id },
        seenBy: { $ne: req.user._id },
      },
      {
        $push: {
          seenBy: req.user._id,
        },
      }
    );

    const receiver = chat.participants.find(
  (id) => id.toString() !== req.user._id.toString()
);

if (receiver) {
  io.to(receiver.toString()).emit("messagesSeen", {
    chatId: chat._id,
    seenBy: req.user._id,
  });
}
    res.status(200).json({
      success: true,
      message: "Messages marked as seen",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

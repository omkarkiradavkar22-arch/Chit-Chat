import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { io } from "../socket/socket.js";
import Task from "../models/Task.js";
import { detectTask } from "../services/aiTaskDetector.js";
import { detectNotificationPriority } from "../services/notificationPriorityDetector.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const uploadToCloudinary = (buffer, folder = "messages", resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ChitChat/${folder}`,
        resource_type: resourceType,
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
    const { text, replyTo, latitude, longitude } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (chat.isBlocked) {
  return res.status(403).json({
    success: false,
    message: "This chat is blocked",
  });
}

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

    const attachments = [];
    let audio = null;

if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    let type = "file";

    if (file.mimetype.startsWith("image")) {
      type = "image";
    } else if (file.mimetype.startsWith("video")) {
      type = "video";
    } else if (file.mimetype.startsWith("audio")) {
      type = "audio";
    }

    // Cloudinary has no dedicated "audio" resource type — voice notes
    // MUST upload as resource_type "video", not "auto", otherwise
    // Cloudinary can misclassify the webm/opus file and serve it with
    // the wrong Content-Type, which silently breaks <audio> playback.
    const resourceType = type === "audio" ? "video" : "auto";

    const result = await uploadToCloudinary(
      file.buffer,
      "messages",
      resourceType
    );

    attachments.push({
      public_id: result.public_id,
      url: result.secure_url,
      type,
      originalName: file.originalname,
      size: file.size,
      duration:
        type === "audio" && req.body.duration
          ? Number(req.body.duration)
          : undefined,
    });
  }
}

if (
  !text &&
  attachments.length === 0 &&
  !audio &&
  !(latitude && longitude)
) {
  return res.status(400).json({
    success: false,
    message: "Message cannot be empty",
  });
}

   // const chat = await Chat.findById(chatId);

let expiresAt = null;

if (
  chat?.disappearingMessages?.enabled &&
  chat.disappearingMessages.duration
) {
  expiresAt = new Date(
    Date.now() +
      chat.disappearingMessages.duration * 1000
  );
}
    const message = await Message.create({
  chat: chat._id,
  sender: req.user._id,
  text,
  attachments,
   expiresAt,
  audio,
  replyTo: replyTo || null,
  delivered: true,
  seenBy: [req.user._id],

   location:
    latitude && longitude
      ? {
          latitude: Number(latitude),
          longitude: Number(longitude),
        }
      : null,
});

   chat.lastMessage = message._id;

    await chat.save();

const receiver = chat.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    // =========================
    // AI TASK DETECTION
    // Runs for BOTH participants — the detector can't tell whose task
    // it actually is ("call me tomorrow" is the RECEIVER's task, "I'll
    // call you tomorrow" is the SENDER's), so we check each person's
    // own aiTaskDetectionEnabled preference independently and add a
    // task to whichever of them has it turned on. Each person can
    // freely delete a task that isn't actually theirs.
    // =========================
    if (text) {
      try {
        const detection = detectTask(text);

        if (detection.isTask) {
          const recipients = [];

          if (req.user.aiTaskDetectionEnabled) {
            recipients.push(req.user._id);
          }

          if (receiver) {
            const receiverUser = await User.findById(receiver).select(
              "aiTaskDetectionEnabled"
            );

            if (receiverUser?.aiTaskDetectionEnabled) {
              recipients.push(receiver);
            }
          }

          await Promise.all(
            recipients.map((userId) =>
              Task.create({
                user: userId,
                chat: chat._id,
                message: message._id,
                title: detection.title,
                deadline: detection.deadline,
              })
            )
          );
        }
      } catch (taskError) {
        console.error("AI TASK DETECTION ERROR:", taskError);
      }
    }

// =========================
// 🔔 SMART NOTIFICATION PRIORITY
// =========================

if (text && receiver) {
  try {
    const priority = detectNotificationPriority(text);

    // Normal chat messages should ONLY bump the Messages badge
    // (handled elsewhere via chat.unreadCount) — they must NOT
    // create a Notification or show up in the Notifications feed.
    if (priority === "important" || priority === "urgent") {
      await Notification.create({
        sender: req.user._id,
        receiver,
        type: "message",
        priority,
        text,
        chat: chat._id,
        message: message._id,
      });
    }

  } catch (notificationError) {
    console.error(
      "SMART NOTIFICATION ERROR:",
      notificationError
    );
  }
}

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

    if (
      message.sender.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only sender can delete for everyone",
      });
    }

    message.deletedForEveryone = true;
    message.text = "This message was deleted";
    message.attachments = [];
    message.replyTo = null;

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "name username profilePic");

    // Get chat participants
    const chat = await Chat.findById(message.chat);

    if (chat) {
      chat.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit(
          "messageDeleted",
          updatedMessage
        );
      });
    }

    res.status(200).json({
      success: true,
      message: updatedMessage,
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

export const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Remove old reaction from same user
    message.reactions = message.reactions.filter(
      (reaction) =>
        reaction.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji,
    });

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "name username profilePic");

    res.status(200).json({
      success: true,
      message: updatedMessage,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const forwardMessage = async (req, res) => {
  try {
    const { chatId } = req.body;

    const originalMessage = await Message.findById(
      req.params.messageId
    );

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // User must belong to destination chat
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

    const forwardedMessage = await Message.create({
      chat: chat._id,
      sender: req.user._id,

      text: originalMessage.text,

attachments: originalMessage.attachments || [],

replyTo: null,

      forwardedFrom: originalMessage._id,

      delivered: true,

      seenBy: [req.user._id],
    });

    chat.lastMessage = forwardedMessage._id;

    await chat.save();

    const populatedMessage =
      await Message.findById(forwardedMessage._id)
        .populate(
          "sender",
          "name username profilePic"
        )
        .populate(
          "forwardedFrom"
        );

    const receiver = chat.participants.find(
      (id) =>
        id.toString() !==
        req.user._id.toString()
    );

    if (receiver) {
      io.to(receiver.toString()).emit(
        "newMessage",
        populatedMessage
      );
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

export const getChatMedia = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Only chat participants can access gallery
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
      chat: chatId,
      deletedFor: {
        $ne: req.user._id,
      },
      deletedForEveryone: false,
    }).select("text attachments createdAt sender");

    const photos = [];
    const videos = [];
    const files = [];
    const links = [];

    messages.forEach((message) => {
      // Attachments
      message.attachments?.forEach((attachment) => {
        if (attachment.type === "image") {
          photos.push({
            ...attachment.toObject(),
            messageId: message._id,
            createdAt: message.createdAt,
          });
        }

        if (attachment.type === "video") {
          videos.push({
            ...attachment.toObject(),
            messageId: message._id,
            createdAt: message.createdAt,
          });
        }

        if (attachment.type === "file") {
          files.push({
            ...attachment.toObject(),
            messageId: message._id,
            createdAt: message.createdAt,
          });
        }
      });

      // Links from text messages
      if (message.text) {
        const urlRegex =
          /(https?:\/\/[^\s]+)/g;

        const foundLinks = message.text.match(urlRegex);

        foundLinks?.forEach((url) => {
          links.push({
            url,
            messageId: message._id,
            createdAt: message.createdAt,
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      gallery: {
        photos,
        videos,
        files,
        links,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleStar = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const userId = req.user._id.toString();
    const alreadyStarred = message.starredBy.some(
      (id) => id.toString() === userId
    );

    if (alreadyStarred) {
      message.starredBy = message.starredBy.filter(
        (id) => id.toString() !== userId
      );
    } else {
      message.starredBy.push(req.user._id);
    }

    await message.save();

    res.status(200).json({
      success: true,
      starred: !alreadyStarred,
      messageId: message._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStarredMessages = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {
      starredBy: req.user._id,
    };

    if (search) {
      filter.text = { $regex: search, $options: "i" };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .populate("sender", "name username profilePic")
      .populate("chat", "participants");

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const messages = await Message.find({
      text: {
        $regex: query.trim(),
        $options: "i",
      },
      deletedFor: {
        $ne: req.user._id,
      },
      deletedForEveryone: false,
    })
      .populate("sender", "name username profilePic")
      .populate("chat", "participants")
      .sort({ createdAt: -1 })
      .limit(100);

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

export const naturalLanguageSearch = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // =========================
    // CHECK CHAT
    // =========================

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Only chat participants can search
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

    // =========================
    // NORMALIZE QUERY
    // =========================

    let searchText = query
      .toLowerCase()
      .trim();

    // =========================
    // STOP WORDS
    // =========================

    const stopWords = new Set([
      "what",
      "did",
      "we",
      "talk",
      "talked",
      "about",
      "regarding",
      "find",
      "search",
      "show",
      "me",
      "the",
      "message",
      "messages",
      "msg",
      "chat",
      "chats",
      "please",
      "can",
      "you",
      "mala",
      "mala",
      "shodh",
      "shodha",
      "baddal",
      "baddalcha",
      "baddalche",
      "baddalchi",
      "cha",
      "chi",
      "che",
      "madhe",
      "madhla",
      "madhle",
      "madhli",
      "about",
    ]);

    // =========================
    // SYNONYM / MEANING MAP
    // =========================

    const synonymMap = {
      college: [
        "college",
        "clg",
        "coll",
        "campus",
      ],

      tomorrow: [
        "tomorrow",
        "udya",
        "उद्या",
      ],

      today: [
        "today",
        "aaj",
        "आज",
      ],

      yesterday: [
        "yesterday",
        "kal",
        "काल",
      ],

      class: [
        "class",
        "lecture",
        "lec",
        "वर्ग",
      ],

      exam: [
        "exam",
        "examination",
        "paper",
        "test",
        "परीक्षा",
      ],

      assignment: [
        "assignment",
        "assign",
        "task",
        "homework",
      ],

      friend: [
        "friend",
        "mitra",
        "मित्र",
        "frnd",
      ],
    };

    // =========================
    // EXTRACT WORDS
    // =========================

    const words = searchText
      .split(/\s+/)
      .map((word) =>
        word.replace(/[?!.,'"]/g, "")
      )
      .filter((word) => word.length >= 2)
      .filter(
        (word) => !stopWords.has(word)
      );

    // =========================
    // EXPAND SEARCH TERMS
    // =========================

    const expandedTerms = new Set();

    words.forEach((word) => {
      let foundGroup = false;

      for (const [key, synonyms] of Object.entries(
        synonymMap
      )) {
        if (synonyms.includes(word)) {
          synonyms.forEach((term) =>
            expandedTerms.add(term)
          );

          foundGroup = true;
          break;
        }
      }

      // If word doesn't belong to a known group
      // search the original word too
      if (!foundGroup) {
        expandedTerms.add(word);
      }
    });

    // =========================
    // BUILD REGEX
    // =========================

    const terms = [...expandedTerms];

    const regexPattern = terms
      .map((term) =>
        term.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )
      )
      .join("|");

    // =========================
    // DATABASE SEARCH
    // =========================

    const filter = {
      chat: chat._id,

      deletedFor: {
        $ne: req.user._id,
      },

      deletedForEveryone: false,
    };

    if (terms.length > 0) {
      filter.text = {
        $regex: regexPattern,
        $options: "i",
      };
    }

    const messages = await Message.find(filter)
      .populate(
        "sender",
        "name username profilePic"
      )
      .sort({ createdAt: -1 })
      .limit(50);

    // =========================
    // SIMPLE RELEVANCE SCORE
    // =========================

    const scoredMessages = messages
      .map((message) => {
        const text =
          message.text?.toLowerCase() || "";

        let score = 0;

        terms.forEach((term) => {
          if (text.includes(term.toLowerCase())) {
            score++;
          }
        });

        return {
          message,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const results = scoredMessages.map(
      (item) => item.message
    );

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,

      query,

      understoodTerms: words,

      expandedTerms: terms,

      count: results.length,

      messages: results,
    });

  } catch (error) {
    console.error(
      "Natural Language Search Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
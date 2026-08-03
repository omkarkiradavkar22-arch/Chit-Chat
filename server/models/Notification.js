import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "follow",
        "follow_request",
        "follow_accept",
        "like",
        "comment",
        "message",
        // 📞 CALLS
    "incoming_call",
    "missed_call",
      ],
      required: true,
    },

    
   priority: {
  type: String,
  enum: ["urgent", "important", "normal"],
  default: "normal",
  },

    // Only populated for type: "message" — lets the notification
    // show a preview ("...msg: 'call me tomorrow'") and lets clicking
    // it jump straight to the right chat.
    text: {
      type: String,
      default: null,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    status: {
  type: String,
  enum: ["pending", "accepted", "rejected"],
  default: "pending",
},

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    
    isRead: {
      type: Boolean,
      default: false,
    },


  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
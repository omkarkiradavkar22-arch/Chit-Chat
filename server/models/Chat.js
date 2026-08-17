import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    pinnedMessage: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null,
},

    isBlocked: {
  type: Boolean,
  default: false,
},

disappearingMessages: {
  enabled: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number,
    default: null,
  },
},

liveLocation: {
  active: {
    type: Boolean,
    default: false,
  },

  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  latitude: {
    type: Number,
    default: null,
  },

  longitude: {
    type: Number,
    default: null,
  },

  startedAt: {
    type: Date,
    default: null,
  },

  expiresAt: {
    type: Date,
    default: null,
  },
},

blockedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
}
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Chat", chatSchema);
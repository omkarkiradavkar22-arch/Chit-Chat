import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      default: "",
    },

    messageType: {
  type: String,
  enum: ["text", "call"],
  default: "text",
},

callType: {
  type: String,
  enum: ["incoming", "missed", "outgoing"],
  default: null,
},

callDuration: {
  type: Number,
  default: 0,
},

    location: {
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
},

//     image: {
//   url: String,
//   public_id: String,
// },

attachments: [
  {
    url: String,
    public_id: String,
    type: {
  type: String,
  enum: ["image", "video", "audio", "file"],
},
    originalName: String,
    size: Number,
    duration: Number, // seconds — used for voice message playback UI
  },
],

   audio: {
  public_id: {
    type: String,
  },
  url: {
    type: String,
  },
  duration: {
    type: Number,
    default: 0,
  },
},

replyTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null,
},

    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    forwardedFrom: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null,
},

    reactions: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emoji: {
      type: String,
    },
  },
],

    isEdited: {
      type: Boolean,
      default: false,
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],


    starredBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    delivered: {
  type: Boolean,
  default: false,
},

expiresAt: {
  type: Date,
  default: null,
  index: true,
},

  },
  {
    timestamps: true,
  }
);

messageSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("Message", messageSchema);
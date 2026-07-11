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

    image: {
      public_id: String,
      url: String,
    },

    audio: {
  public_id: {
    type: String,
  },
  url: {
    type: String,
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

    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    delivered: {
  type: Boolean,
  default: false,
},

  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
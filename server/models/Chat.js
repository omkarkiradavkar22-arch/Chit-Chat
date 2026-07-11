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

    isBlocked: {
  type: Boolean,
  default: false,
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
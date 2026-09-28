import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Comment", commentSchema);
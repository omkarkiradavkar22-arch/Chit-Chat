import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text,
    });

    post.comments.push(comment._id);

    await post.save();

    if (post.user.toString() !== req.user._id.toString()) {
  await Notification.create({
    sender: req.user._id,
    receiver: post.user,
    type: "comment",
    post: post._id,
    comment: comment._id,
  });
}

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name username profilePic");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getComments = async (req, res) => {
  try {

    const comments = await Comment.find({
      post: req.params.postId,
    })
      .populate("user", "name username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editComment = async (req, res) => {
  try {

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can edit only your comment",
      });
    }

    comment.text = req.body.text;
    comment.isEdited = true;

    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment updated",
      comment,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // 👇 NEW
    const post = await Post.findById(comment.post);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 👇 NEW
    const isCommentOwner =
      comment.user.toString() === req.user._id.toString();

    const isPostOwner =
      post.user.toString() === req.user._id.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment",
      });
    }

    await Post.findByIdAndUpdate(comment.post, {
      $pull: {
        comments: comment._id,
      },
    });

    await Comment.findByIdAndDelete(comment._id);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


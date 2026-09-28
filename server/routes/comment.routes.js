import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  addComment,
  getComments,
  editComment,
  deleteComment,
  toggleCommentLike,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.post("/:postId", protect, addComment);

router.get("/:postId", protect, getComments);

router.put("/:commentId", protect, editComment);

router.post(
  "/:commentId/toggle-like",
  protect,
  toggleCommentLike
);

router.delete("/:commentId", protect, deleteComment);

export default router;
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  editPost,
   deletePost,
  //  likePost,
  getSinglePost,
  toggleLike,
  toggleSavePost,
  getSavedPosts,
  getLikedPosts
} from "../controllers/post.controller.js";
const router = express.Router();

router.post(
  "/",
  protect,
  upload.array("images", 10),
  createPost
);
router.get("/liked", protect, getLikedPosts);
router.put("/:id", protect, editPost);
router.get("/feed", protect, getFeedPosts);
router.get("/saved", protect, getSavedPosts);

router.get("/user/:username", protect, getUserPosts);
router.get("/:id", protect, getSinglePost);
//router.post("/:id/unlike", protect, unlikePost);
router.post("/:id/toggle-like", protect, toggleLike);
router.post("/:id/toggle-save", protect, toggleSavePost);
router.delete("/:id", protect, deletePost);
export default router;
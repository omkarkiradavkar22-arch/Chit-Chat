import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getUserPosts,
  editPost,
   deletePost,
  //  likePost,
  getSinglePost,
  toggleLike,
  toggleSavePost,
  getSavedPosts,
  getLikedPosts,
  toggleHideLikesCount,
toggleComments,
getPostLikers,
togglePinPost
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
router.get("/explore", protect, getExplorePosts);
router.get("/saved", protect, getSavedPosts);

router.get("/user/:username", protect, getUserPosts);
router.get("/:id", protect, getSinglePost);
//router.post("/:id/unlike", protect, unlikePost);
router.get("/:id/likers", protect, getPostLikers);
router.post("/:id/toggle-like", protect, toggleLike);

router.patch(
  "/:id/toggle-hide-likes",
  protect,
  toggleHideLikesCount
);

router.patch(
  "/:id/toggle-comments",
  protect,
  toggleComments
);

router.patch(
  "/:id/toggle-pin",
  protect,
  togglePinPost
);

router.post("/:id/toggle-save", protect, toggleSavePost);
router.delete("/:id", protect, deletePost);
export default router;
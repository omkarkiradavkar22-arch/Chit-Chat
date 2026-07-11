import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  updateProfile,
  getUserProfile,
  searchUsers,
  followUser,
  unfollowUser,
  togglePrivacy,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  cancelFollowRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "coverPic", maxCount: 1 },
  ]),
  updateProfile
);

router.get("/search", protect, searchUsers);
router.patch("/privacy", protect, togglePrivacy);
router.get("/follow-requests", protect, getFollowRequests);
router.get("/:username", protect, getUserProfile);

router.post("/follow/:id", protect, followUser);
router.post("/unfollow/:id", protect, unfollowUser);

router.post(
  "/accept-request/:id",
  protect,
  acceptFollowRequest
);

router.post(
  "/reject-request/:id",
  protect,
  rejectFollowRequest
);

router.delete(
  "/cancel-request/:id",
  protect,
  cancelFollowRequest
);

export default router;
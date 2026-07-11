import upload from "../middleware/upload.middleware.js";
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteForMe,
  deleteForEveryone,
  markAsSeen
} from "../controllers/message.controller.js";

const router = express.Router();

router.post(
  "/:chatId",
  protect,
  upload.single("image"),
  sendMessage
);

router.get("/:chatId", protect, getMessages);
router.put("/:chatId/seen", protect, markAsSeen);
router.put("/:messageId", protect, editMessage);

router.delete("/:messageId/me", protect, deleteForMe);

router.delete("/:messageId/everyone", protect, deleteForEveryone);

export default router;
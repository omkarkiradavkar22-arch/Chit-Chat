import upload from "../middleware/upload.middleware.js";
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteForMe,
  deleteForEveryone,
  markAsSeen,
  reactToMessage,
  forwardMessage,
  getChatMedia,
  toggleStar,
  getStarredMessages,
} from "../controllers/message.controller.js";
const router = express.Router();

// NOTE: this must be registered BEFORE "/:chatId" below, otherwise
// Express matches "/starred" against "/:chatId" first and treats
// "starred" as a chat id.
router.get("/starred", protect, getStarredMessages);

router.post(
  "/:chatId",
  protect,
  upload.array("attachments", 10),
  sendMessage
);

router.get("/:chatId", protect, getMessages);
router.get("/:chatId/media", protect, getChatMedia);
router.put("/:chatId/seen", protect, markAsSeen);
router.put("/:messageId/react", protect, reactToMessage);

router.post(
  "/:messageId/forward",
  protect,
  forwardMessage
);

router.post("/:messageId/star", protect, toggleStar);

router.put("/:messageId", protect, editMessage);


router.delete("/:messageId/me", protect, deleteForMe);

router.delete("/:messageId/everyone", protect, deleteForEveryone);

export default router;

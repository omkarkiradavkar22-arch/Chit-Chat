import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createChat,
  getMyChats,
  pinMessage,
  unpinMessage,
  blockChat,
  unblockChat,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/:userId", protect, createChat);

router.post("/:chatId/pin/:messageId", protect, pinMessage);

router.post("/:chatId/unpin", protect, unpinMessage);

router.post("/:chatId/block", protect, blockChat);

router.post("/:chatId/unblock", protect, unblockChat);

router.get("/", protect, getMyChats);

export default router;

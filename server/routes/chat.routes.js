import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createChat,
  getMyChats,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/:userId", protect, createChat);

router.get("/", protect, getMyChats);

export default router;
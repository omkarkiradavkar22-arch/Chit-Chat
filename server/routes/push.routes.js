import express from "express";
import { savePushSubscription } from "../controllers/push.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/subscribe",
  protect,
  savePushSubscription
);

export default router;
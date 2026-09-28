import express from "express";
import {
  declineCall,
  getPendingCall,
  acceptPendingCall,
} from "../controllers/call.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get(
  "/pending",
  protect,
  getPendingCall
);

router.post(
  "/accept",
  protect,
  acceptPendingCall
);

router.post("/decline", protect, declineCall);

export default router;
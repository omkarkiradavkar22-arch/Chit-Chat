import express from "express";

import {
  sharePostPreview,
} from "../controllers/shareController.js";

const router = express.Router();

router.get(
  "/post/:postId",
  sharePostPreview
);

export default router;
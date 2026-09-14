import express from "express";

import {
  sharePostPreview,
} from "../controllers/shareController.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Share router working");
});

router.get(
  "/post/:postId",
  sharePostPreview
);

export default router;

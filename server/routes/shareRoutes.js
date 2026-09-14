import express from "express";

import {
  sharePostPreview,
} from "../controllers/shareController.js";

const router = express.Router();

router.get(
  "/post/:postId",
  sharePostPreview
);

router.get("/test", (req, res) => {
  res.send("Share router working");
});

export default router;

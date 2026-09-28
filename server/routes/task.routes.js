import express from "express";
import { protect } from "../middleware/auth.middleware.js";

import {
  createTask,
  getMyTasks,
  toggleTask,
  deleteTask,
} from "../controllers/task.controller.js";

const router = express.Router();

// Create task
router.post("/", protect, createTask);

// Get logged-in user's tasks
router.get("/", protect, getMyTasks);

// Complete / uncomplete task
router.put("/:taskId/complete", protect, toggleTask);
// Delete task
router.delete("/:taskId", protect, deleteTask);

export default router;
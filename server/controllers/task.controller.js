import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
// =========================
// CREATE TASK
// =========================
export const createTask = async (req, res) => {
  try {
    const { chat, message, title, deadline } = req.body;

    if (!chat || !message || !title) {
      return res.status(400).json({
        success: false,
        message: "Chat, message and title are required",
      });
    }

    const task = await Task.create({
      user: req.user._id,
      chat,
      message,
      title,
      deadline: deadline || null,
    });

    await Notification.create({
  sender: req.user._id,
  receiver: req.user._id,
  type: "task",
  text: `New task generated: ${title}. Complete it soon!`,
  chat,
  message,
  priority: "important",
});

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};


// =========================
// GET MY TASKS
// =========================
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
    })
      .populate("message")
      .populate("chat")
      .sort({ completed: 1, deadline: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};


// =========================
// COMPLETE / UNCOMPLETE TASK
// =========================
export const toggleTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.completed = !task.completed;

    await task.save();

    return res.status(200).json({
      success: true,
      message: task.completed
        ? "Task completed"
        : "Task marked as pending",
      task,
    });
  } catch (error) {
    console.error("TOGGLE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};


// =========================
// DELETE TASK
// =========================
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOneAndDelete({
      _id: taskId,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

import Notification from "../models/Notification.js";
import { detectNotificationPriority } from "../services/notificationPriorityDetector.js";
import User from "../models/User.js";

export const getNotifications = async (req, res) => {
  try {
    const currentUser = await User.findById(
      req.user._id
    ).select("blockedUsers");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================
    // BLOCK RELATIONSHIP FILTER
    // =========================

    // Users blocked by me
    const blockedByMeIds = (
      currentUser.blockedUsers || []
    ).map((id) => id.toString());

    // Users who blocked me
    const usersWhoBlockedMe = await User.find({
      blockedUsers: currentUser._id,
    }).select("_id");

    const usersWhoBlockedMeIds =
      usersWhoBlockedMe.map((user) =>
        user._id.toString()
      );

    // Both directions
    const blockedUserIds = [
      ...new Set([
        ...blockedByMeIds,
        ...usersWhoBlockedMeIds,
      ]),
    ];

    // =========================
    // GET VISIBLE NOTIFICATIONS
    // =========================

    const notifications = await Notification.find({
      receiver: req.user._id,

      sender: {
        $nin: blockedUserIds,
      },
    })
      .populate(
        "sender",
        "name username profilePic followers"
      )
      .populate(
        "post",
        "images description"
      )
      .populate(
        "comment",
        "text"
      )
      .sort({ createdAt: -1 });

    // Remove notifications whose sender
    // no longer exists
    const validNotifications =
      notifications.filter((n) => n.sender);

    const updatedNotifications =
      validNotifications.map((n) => {
        const obj = n.toObject();

        obj.isFollowing = (
          n.sender.followers || []
        ).some(
          (id) =>
            id.toString() ===
            req.user._id.toString()
        );

        return obj;
      });

    const unreadCount =
      validNotifications.filter(
        (n) => !n.isRead
      ).length;

    console.log(
      updatedNotifications.map((n) => ({
        type: n.type,
        status: n.status,
        isFollowing: n.isFollowing,
        sender: n.sender.username,
      }))
    );

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications: updatedNotifications,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only notification owner can delete it
    if (
      notification.receiver.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await Notification.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error(
      "DELETE NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};
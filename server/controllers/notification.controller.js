import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
  receiver: req.user._id,
})
.populate("sender", "name username profilePic followers")
.populate("post", "images description")
.populate("comment", "text")
.sort({ createdAt: -1 });

const updatedNotifications = notifications.map((n) => {
  const obj = n.toObject();

  obj.isFollowing = n.sender.followers.some(
    (id) => id.toString() === req.user._id.toString()
  );

  return obj;
});

    const unreadCount = notifications.filter(
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

    res.status(200).json({
      success: true,
      unreadCount,
      notifications: updatedNotifications,
    });

  } catch (error) {
    res.status(500).json({
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

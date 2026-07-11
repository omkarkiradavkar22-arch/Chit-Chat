import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const updateProfile = async (req, res) => {
  try {
    console.log(req.body);
console.log(req.files);
    const { name, username, bio } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase().trim(),
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }

      user.username = username.toLowerCase().trim();
    }

    if (name) {
      user.name = name.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    // Profile Picture
    if (req.files?.profilePic?.[0]) {
      if (user.profilePic?.public_id) {
        await cloudinary.uploader.destroy(
          user.profilePic.public_id
        );
      }

      const result = await uploadToCloudinary(
        req.files.profilePic[0].buffer,
        "ChitChat/profile"
      );

      user.profilePic = result.secure_url;
    }

    // Cover Picture
    if (req.files?.coverPic?.[0]) {
      if (user.coverPic?.public_id) {
        await cloudinary.uploader.destroy(
          user.coverPic.public_id
        );
      }

      const result = await uploadToCloudinary(
        req.files.coverPic[0].buffer,
        "ChitChat/cover"
      );

      user.coverPic = result.secure_url;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = await User.findById(req.user._id);
    const user = await User.findOne({ username })
      .select("-password")
      .populate("followers", "name username profilePic")
      .populate("following", "name username profilePic")
      .populate({
    path: "posts",
    options: { sort: { createdAt: -1 } },
  })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isFollowing = currentUser.following.some(
  (id) => id.toString() === user._id.toString()
);

const isRequested = user.followRequests.some(
  (id) => id.toString() === currentUser._id.toString()
);

const followsMe = user.following.some(
  (id) => id.toString() === currentUser._id.toString()
);

res.status(200).json({
  success: true,
  user,
  relationship: {
    isMe: currentUser._id.toString() === user._id.toString(),
    isFollowing,
    isRequested,
    followsMe,
  },
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // 🔒 Private Account
    if (userToFollow.isPrivate) {

      if (userToFollow.followRequests.includes(currentUser._id)) {
        return res.status(400).json({
          success: false,
          message: "Follow request already sent",
        });
      }

      userToFollow.followRequests.push(currentUser._id);

      await userToFollow.save();

      return res.status(200).json({
        success: true,
        message: "Follow request sent successfully",
      });
    }

    // 🌍 Public Account
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      success: true,
      message: "User followed successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cannot unfollow yourself
    if (userToUnfollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    // Check if following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user",
      });
    }

    // Remove from following
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollow._id.toString()
    );

    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { username: { $regex: keyword, $options: "i" } },
      ],
    }).select("name username profilePic");

    res.status(200).json({
      success: true,
      users,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const togglePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.isPrivate = !user.isPrivate;

    await user.save();

    res.status(200).json({
      success: true,
      message: `Account is now ${
        user.isPrivate ? "Private" : "Public"
      }`,
      isPrivate: user.isPrivate,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followRequests", "name username profilePic");

    res.status(200).json({
      success: true,
      requests: user.followRequests,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptFollowRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const requester = await User.findById(req.params.id);

    if (!requester) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check request exists
    if (!currentUser.followRequests.includes(requester._id)) {
      return res.status(400).json({
        success: false,
        message: "No follow request found",
      });
    }

    // Remove request
    currentUser.followRequests = currentUser.followRequests.filter(
      (id) => id.toString() !== requester._id.toString()
    );

    // Add follower/following
    currentUser.followers.push(requester._id);
    requester.following.push(currentUser._id);

    await currentUser.save();
    await requester.save();

    res.status(200).json({
      success: true,
      message: "Follow request accepted",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectFollowRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    currentUser.followRequests = currentUser.followRequests.filter(
      (id) => id.toString() !== req.params.id
    );

    await currentUser.save();

    res.status(200).json({
      success: true,
      message: "Follow request rejected",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelFollowRequest = async (req, res) => {
  try {
    const userToCancel = await User.findById(req.params.id);

    if (!userToCancel) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove current user from target user's follow requests
    userToCancel.followRequests =
      userToCancel.followRequests.filter(
        (id) =>
          id.toString() !== req.user._id.toString()
      );

    await userToCancel.save();

    res.status(200).json({
      success: true,
      message: "Follow request cancelled",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
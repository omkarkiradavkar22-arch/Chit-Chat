import mongoose from "mongoose";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Notification from "../models/Notification.js";
import { sendPushToUser } from "../services/webPush.js";
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
  .populate("followers", "name username profilePic followRequests")
  .populate("following", "name username profilePic followRequests")
  .populate({
  path: "posts",
  options: { sort: { createdAt: -1 } },
  populate: {
    path: "user",
    select: "name username profilePic",
  },
});

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

const followers = user.followers.map((follower) => ({
  _id: follower._id,
  name: follower.name,
  username: follower.username,
  profilePic: follower.profilePic,
  isFollowing: currentUser.following.some(
    (id) => id.toString() === follower._id.toString()
  ),
  isRequested: (follower.followRequests || []).some(
    (id) => id.toString() === currentUser._id.toString()
  ),
}));

const following = user.following.map((followingUser) => ({
  _id: followingUser._id,
  name: followingUser.name,
  username: followingUser.username,
  profilePic: followingUser.profilePic,
  isFollowing: currentUser.following.some(
    (id) => id.toString() === followingUser._id.toString()
  ),
  isRequested: (followingUser.followRequests || []).some(
    (id) => id.toString() === currentUser._id.toString()
  ),
}));

    const isFollowing = currentUser.following.some(
  (id) => id.toString() === user._id.toString()
);

const isRequested = user.followRequests.some(
  (id) => id.toString() === currentUser._id.toString()
);

const followsMe = user.following.some(
  (id) => id.toString() === currentUser._id.toString()
);

// ==============================
// FORMAT PROFILE POSTS
// ==============================

const formattedPosts = await Promise.all(
  user.posts.map(async (post) => {
    const postObj = post.toObject();

    const likesArray = Array.isArray(post.likes)
      ? post.likes
      : [];

    const commentsArray = Array.isArray(post.comments)
      ? post.comments
      : [];

    const savedPostsArray = Array.isArray(currentUser.savedPosts)
      ? currentUser.savedPosts
      : [];

    // Find a user followed by current user
    // who has liked this post
    const followingIds = new Set(
      (currentUser.following || []).map((id) =>
        id.toString()
      )
    );

    const followedLikerId = likesArray.find(
      (likerId) =>
        followingIds.has(likerId.toString())
    );

    let likedByFollowingUser = null;

    if (followedLikerId) {
      likedByFollowingUser = await User.findById(
        followedLikerId
      ).select("name username profilePic");
    }

    let firstLiker = null;

const firstLikerId = likesArray[0];

if (firstLikerId) {
  firstLiker = await User.findById(
    firstLikerId
  ).select("name username profilePic");
}

    return {
      ...postObj,

      likesCount: likesArray.length,

      commentsCount: commentsArray.length,

      isLiked: likesArray.some(
        (id) =>
          id.toString() ===
          currentUser._id.toString()
      ),

      isSaved: savedPostsArray.some(
        (id) =>
          id.toString() ===
          post._id.toString()
      ),

      likedByFollowingUser,
      firstLiker,
    };
  })
);

const userResponse = user.toObject();

userResponse.followers = followers;
userResponse.following = following;

// IMPORTANT:
// Use formatted posts instead of raw populated posts
userResponse.posts = formattedPosts;

res.status(200).json({
  success: true,
  user: userResponse,
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

    if (
      userToFollow._id.toString() ===
      currentUser._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    if (
      currentUser.following.some(
        (id) =>
          id.toString() ===
          userToFollow._id.toString()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // 🔒 PRIVATE ACCOUNT
    if (userToFollow.isPrivate) {
      if (
        userToFollow.followRequests.some(
          (id) =>
            id.toString() ===
            currentUser._id.toString()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Follow request already sent",
        });
      }

      userToFollow.followRequests.push(currentUser._id);

      await userToFollow.save();

      const existingNotification =
        await Notification.findOne({
          sender: currentUser._id,
          receiver: userToFollow._id,
          type: "follow_request",
          status: "pending",
        });

      if (!existingNotification) {
        const notification =
          await Notification.create({
            sender: currentUser._id,
            receiver: userToFollow._id,
            type: "follow_request",
          });

        // 🔔 PUSH NOTIFICATION
        await sendPushToUser(userToFollow._id, {
          title: "Follow Request 👤",
          body: `${currentUser.name} sent you a follow request`,
          icon:
            currentUser.profilePic ||
            "/default-profile-picture.png",

          data: {
            type: "follow_request",
            notificationId:
              notification._id.toString(),
            url: "/notifications",
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Follow request sent successfully",
      });
    }

    // 🌍 PUBLIC ACCOUNT
    currentUser.following.push(userToFollow._id);

    userToFollow.followers.push(currentUser._id);

    const notification =
      await Notification.create({
        sender: currentUser._id,
        receiver: userToFollow._id,
        type: "follow",
      });

    await currentUser.save();

    await userToFollow.save();

    // 🔔 SEND PUSH NOTIFICATION
    await sendPushToUser(userToFollow._id, {
      title: "New Follower 👤",
      body: `${currentUser.name} started following you`,
      icon:
        currentUser.profilePic ||
        "/default-profile-picture.png",

      data: {
        type: "follow",
        notificationId:
          notification._id.toString(),
        url: "/notifications",
      },
    });

    res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    console.error("FOLLOW USER ERROR:", error);

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

export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(
      req.user._id
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---------------------------------
    // USERS WITH BLOCKED RELATIONSHIP
    // ---------------------------------
    const blockedChats = await Chat.find({
      participants: currentUser._id,
      isBlocked: true,
    }).select("participants");

    const blockedUserIds = blockedChats.flatMap(
      (chat) =>
        chat.participants
          .filter(
            (participantId) =>
              participantId.toString() !==
              currentUser._id.toString()
          )
          .map((participantId) =>
            participantId.toString()
          )
    );

    // ---------------------------------
    // USERS WITH PENDING REQUEST
    // sent by current user
    // ---------------------------------
    const pendingUsers = await User.find({
      followRequests: currentUser._id,
    }).select("_id");

    const pendingUserIds = pendingUsers.map(
      (user) => user._id.toString()
    );

    // ---------------------------------
// DISMISSED USERS FROM FRONTEND
// ---------------------------------
const dismissedIds = req.query.exclude
  ? req.query.exclude
      .split(",")
      .filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )
  : [];

// ---------------------------------
// EXCLUDE USERS
// ---------------------------------
const excludedIds = [
  currentUser._id.toString(),

  ...currentUser.following.map((id) =>
    id.toString()
  ),

  ...blockedUserIds,

  ...dismissedIds,
];

    // ---------------------------------
    // RANDOM 3 SUGGESTIONS
    // ---------------------------------
    const suggestions = await User.aggregate([
  {
    $match: {
      _id: {
        $nin: excludedIds.map(
          (id) =>
            new mongoose.Types.ObjectId(id)
        ),
      },
    },
  },

  {
    $sample: {
      size: 3,
    },
  },

  {
   $project: {
  name: 1,
  username: 1,
  profilePic: 1,
  isPrivate: 1,
  followers: 1,
  following: 1,
},
  },
]);

// ---------------------------------
// MUTUAL FOLLOW CONTEXT
// Example:
// A follows B
// B follows C
// C suggestion → "Followed by B"
// ---------------------------------

const currentFollowingIds =
  currentUser.following.map((id) =>
    id.toString()
  );

const mutualUserIds = new Set();

suggestions.forEach((suggestedUser) => {
  (suggestedUser.followers || []).forEach(
    (followerId) => {
      const id = followerId.toString();

      if (currentFollowingIds.includes(id)) {
        mutualUserIds.add(id);
      }
    }
  );
});

const mutualUsers = await User.find({
  _id: {
    $in: [...mutualUserIds],
  },
}).select("name username profilePic");

const mutualUserMap = new Map(
  mutualUsers.map((mutualUser) => [
    mutualUser._id.toString(),
    {
      _id: mutualUser._id,
      name: mutualUser.name,
      username: mutualUser.username,
      profilePic: mutualUser.profilePic,
    },
  ])
);

const formattedSuggestions =
  suggestions.map((suggestedUser) => {
    const followedBy = (
      suggestedUser.followers || []
    )
      .map((followerId) =>
        mutualUserMap.get(
          followerId.toString()
        )
      )
      .filter(Boolean);

    const {
      followers,
      ...userData
    } = suggestedUser;

   const followsYou = (
  suggestedUser.following || []
).some(
  (followingId) =>
    followingId.toString() ===
    currentUser._id.toString()
);

// Check if current user already sent
// a follow request to this suggested user
const isRequested = pendingUserIds.includes(
  suggestedUser._id.toString()
);

return {
  ...userData,
  followedBy,
  followsYou,
  isRequested,
};
  });

return res.status(200).json({
  success: true,
  users: formattedSuggestions,
});

  } catch (error) {
    console.error(
      "GET SUGGESTED USERS ERROR:",
      error
    );

    return res.status(500).json({
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

    
    const updatedNotification = await Notification.updateMany(
  {
    sender: requester._id,
    receiver: currentUser._id,
    type: "follow_request",
  },
  {
    $set: {
      status: "accepted",
    },
  }
);

console.log("Updated Notification:", updatedNotification);

    await Notification.create({
  sender: currentUser._id,
  receiver: requester._id,
  type: "follow_accept",
  });
    
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
const uploadToCloudinary = (
  buffer,
  folder,
  resource_type = "auto"
) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const toggleAITaskDetection = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.aiTaskDetectionEnabled = !user.aiTaskDetectionEnabled;

    await user.save();

    res.status(200).json({
      success: true,
      message: `AI Task Detection is now ${
        user.aiTaskDetectionEnabled ? "ON" : "OFF"
      }`,
      aiTaskDetectionEnabled: user.aiTaskDetectionEnabled,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProfileSharePreview = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("name username profilePic bio");

    if (!user) {
      return res.status(404).send("User not found");
    }

    const frontendUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const profileUrl =
      `${frontendUrl}/profile/${user.username}`;

    let profileImage = user.profilePic;

    // Convert default relative image into full URL
    if (
      !profileImage ||
      profileImage === "/default-profile-picture.png"
    ) {
      profileImage =
        `${frontendUrl}/default-profile-picture.png`;
    }

    const description =
      user.bio?.trim() ||
      `View @${user.username}'s profile on Chit-Chat`;

    // Escape values before putting them inside HTML
    const escapeHtml = (value = "") =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    const safeName = escapeHtml(user.name);
    const safeUsername = escapeHtml(user.username);
    const safeDescription = escapeHtml(description);
    const safeProfileUrl = escapeHtml(profileUrl);
    const safeProfileImage = escapeHtml(profileImage);

    return res
      .status(200)
      .type("html")
      .send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              ${safeName} (@${safeUsername}) | Chit-Chat
            </title>

            <!-- Open Graph -->
            <meta
              property="og:title"
              content="${safeName} (@${safeUsername})"
            />

            <meta
              property="og:description"
              content="${safeDescription}"
            />

            <meta
              property="og:image"
              content="${safeProfileImage}"
            />

            <meta
              property="og:url"
              content="${safeProfileUrl}"
            />

            <meta
              property="og:type"
              content="profile"
            />

            <meta
              property="og:site_name"
              content="Chit-Chat"
            />

            <!-- Twitter / Other platforms -->
            <meta
              name="twitter:card"
              content="summary_large_image"
            />

            <meta
              name="twitter:title"
              content="${safeName} (@${safeUsername})"
            />

            <meta
              name="twitter:description"
              content="${safeDescription}"
            />

            <meta
              name="twitter:image"
              content="${safeProfileImage}"
            />

            <!-- Open profile in Chit-Chat -->
            <meta
              http-equiv="refresh"
              content="0;url=${safeProfileUrl}"
            />
          </head>

          <body>
            <p>
              Opening ${safeName}'s Chit-Chat profile...
            </p>

            <script>
              window.location.replace(
                ${JSON.stringify(profileUrl)}
              );
            </script>
          </body>
        </html>
      `);
  } catch (error) {
    console.error(
      "PROFILE SHARE PREVIEW ERROR:",
      error
    );

    return res.status(500).send(
      "Unable to load profile preview"
    );
  }
};

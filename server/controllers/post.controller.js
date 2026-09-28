import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Notification from "../models/Notification.js";
import { sendPushToUser } from "../services/webPush.js";

const getLikedByFollowingUser = async (
  post,
  currentUser
) => {
  const followingIds = new Set(
    (currentUser.following || []).map((id) =>
      id.toString()
    )
  );

  const followedLikerId = (post.likes || []).find(
    (likerId) =>
      followingIds.has(likerId.toString())
  );

  if (!followedLikerId) {
    return null;
  }

  return await User.findById(
    followedLikerId
  ).select("name username profilePic");
};

const getFirstLiker = async (post) => {
  const firstLikerId = post.likes?.[0];

  if (!firstLikerId) {
    return null;
  }

  return await User.findById(
    firstLikerId
  ).select("name username profilePic");
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ChitChat/posts",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const createPost = async (req, res) => {
  try {
    const { description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    const images = [];

    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer);

      images.push(result.secure_url);
    }

    const post = await Post.create({
      user: req.user._id,
      images,
      description,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        posts: post._id,
      },
    });

    // --------------------------------------------------
// NOTIFY ALL FOLLOWERS ABOUT NEW POST
// --------------------------------------------------

const creator = await User.findById(req.user._id).select(
  "name followers"
);

if (creator && creator.followers.length > 0) {
  await Promise.all(
    creator.followers.map(async (followerId) => {
      // Save notification in ChitChat notification feed
      await Notification.create({
        sender: req.user._id,
        receiver: followerId,
        type: "post",
        post: post._id,
        priority: "normal",
      });

      // Send Web Push notification
      await sendPushToUser(followerId.toString(), {
        type: "post",
        title: `${creator.name} posted something new`,
        body: "Tap to view the new post.",
        postId: post._id.toString(),
        url: `/post/${post._id}`,
        tag: `post-${post._id}`,
      });
    })
  );
}

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSinglePost = async (req, res) => {
  try {

    const currentUser = await User.findById(req.user._id);

    const post = await Post.findById(req.params.id)
      .populate("user", "name username profilePic");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // =====================================
// BLOCK RELATIONSHIP CHECK
// =====================================

const postOwner = await User.findById(
  post.user._id
).select("blockedUsers");

if (!postOwner) {
  return res.status(404).json({
    success: false,
    message: "Post owner not found",
  });
}

// Did I block the post owner?
const iBlockedThem = (
  currentUser.blockedUsers || []
).some(
  (id) =>
    id.toString() === postOwner._id.toString()
);

// Did post owner block me?
const theyBlockedMe = (
  postOwner.blockedUsers || []
).some(
  (id) =>
    id.toString() === currentUser._id.toString()
);

if (iBlockedThem || theyBlockedMe) {
  return res.status(403).json({
    success: false,
    message: "Post unavailable",
    blocked: true,
  });
}

    const liked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    const saved = currentUser.savedPosts.some(
      (id) => id.toString() === post._id.toString()
    );

    const likedByFollowingUser =
  await getLikedByFollowingUser(
    post,
    currentUser
  );

  const firstLiker =
  await getFirstLiker(post);

    res.status(200).json({
      success: true,
      post: {
        ...post.toObject(),
        isLiked: liked,
        isSaved: saved,
        likesCount: post.likes.length,
commentsCount: post.comments.length,
likedByFollowingUser,
firstLiker,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------
// BLOCK RELATIONSHIP FILTER
// --------------------------------

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

    // -----------------------------
    // PAGINATION
    // -----------------------------
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      20
    );

    /*
      Find users whose posts current user is allowed to see:

      1. Own posts
      2. Public users
      3. Private users followed by current user
    */
    const visibleUsers = await User.find({
  _id: {
    $nin: blockedUserIds,
  },

  $or: [
    {
      _id: req.user._id,
    },
    {
      isPrivate: false,
    },
    {
      isPrivate: true,
      followers: req.user._id,
    },
  ],
}).select("_id");

    const visibleUserIds = visibleUsers.map(
      (user) => user._id
    );

    const query = {
      user: {
        $in: visibleUserIds,
      },
    };

    const totalPosts = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate(
        "user",
        "name username profilePic isPrivate followers followRequests"
      )
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    const updatedPosts = await Promise.all(
  posts
    .filter((post) => post.user)
    .map(async (post) => {
      const postUser = post.user;

      const liked = post.likes.some(
        (id) =>
          id.toString() ===
          req.user._id.toString()
      );

      const saved = currentUser.savedPosts.some(
        (id) =>
          id.toString() ===
          post._id.toString()
      );

      const isFollowing =
        currentUser.following.some(
          (id) =>
            id.toString() ===
            postUser._id.toString()
        );

      const isRequested =
        postUser.followRequests?.some(
          (id) =>
            id.toString() ===
            req.user._id.toString()
        ) || false;

      // --------------------------------
      // FIND A FOLLOWED USER WHO LIKED
      // --------------------------------

      const followingIds = new Set(
        currentUser.following.map((id) =>
          id.toString()
        )
      );

      const followedLikerId = post.likes.find(
        (likerId) =>
          followingIds.has(likerId.toString())
      );

      let likedByFollowingUser = null;

      if (followedLikerId) {
        likedByFollowingUser = await User.findById(
          followedLikerId
        ).select("name username profilePic");
      }

      const firstLiker =
  await getFirstLiker(post);

      return {
        ...post.toObject(),

        isLiked: liked,
        isSaved: saved,

      likesCount: post.likes.length,
commentsCount: post.comments.length,

likedByFollowingUser,
firstLiker,

        user: {
          ...postUser.toObject(),
          isFollowing,
          isRequested,
        },
      };
    })
);

    const hasMore =
      page * limit < totalPosts;

    return res.status(200).json({
      success: true,

      count: updatedPosts.length,

      page,
      limit,

      totalPosts,

      totalPages: Math.ceil(
        totalPosts / limit
      ),

      hasMore,

      posts: updatedPosts,
    });
  } catch (error) {
    console.error("GET FEED ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getExplorePosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------
// BLOCK RELATIONSHIP FILTER
// --------------------------------

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

    // -----------------------------
    // PAGINATION
    // -----------------------------
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 12, 1),
      30
    );

    // -----------------------------
    // FIND PUBLIC USERS
    // -----------------------------
    const publicUsers = await User.find({
  isPrivate: false,

  _id: {
    $nin: blockedUserIds,
  },
}).select("_id");

    const publicUserIds = publicUsers.map(
      (user) => user._id
    );

    const query = {
      user: {
        $in: publicUserIds,
      },
    };

    // Total public posts
    const totalPosts = await Post.countDocuments(query);

    // Only required page fetch
    const posts = await Post.find(query)
      .populate(
        "user",
        "name username profilePic isPrivate"
      )
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    const updatedPosts = await Promise.all(
  posts
    .filter((post) => post.user)
    .map(async (post) => {
          const liked = post.likes.some(
          (id) =>
            id.toString() ===
            req.user._id.toString()
        );

        const saved = currentUser.savedPosts.some(
          (id) =>
            id.toString() ===
            post._id.toString()
        );

        const likedByFollowingUser =
  await getLikedByFollowingUser(
    post,
    currentUser
  );

  const firstLiker =
  await getFirstLiker(post);

        return {
          ...post.toObject(),

          isLiked: liked,
          isSaved: saved,

         likesCount: post.likes.length,
commentsCount: post.comments.length,
likedByFollowingUser,
firstLiker,
        };
          })
);

    const hasMore =
      page * limit < totalPosts;

    return res.status(200).json({
      success: true,

      count: updatedPosts.length,

      page,
      limit,

      totalPosts,

      totalPages: Math.ceil(
        totalPosts / limit
      ),

      hasMore,

      posts: updatedPosts,
    });
  } catch (error) {
    console.log("GET EXPLORE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const profileUser = await User.findOne({
      username: req.params.username.toLowerCase(),
    });

    if (!profileUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(req.user._id);

    const posts = await Post.find({
      user: profileUser._id,
    })
      .populate("user", "name username profilePic")
      .sort({ createdAt: -1 });

    const updatedPosts = await Promise.all(
  posts.map(async (post) => {
      const liked = post.likes.some(
        (id) => id.toString() === req.user._id.toString()
      );

      const saved = currentUser.savedPosts.some(
        (id) => id.toString() === post._id.toString()
      );

      const likedByFollowingUser =
  await getLikedByFollowingUser(
    post,
    currentUser
  );

  const firstLiker =
  await getFirstLiker(post);

    return {
  ...post.toObject(),
  isLiked: liked,
  isSaved: saved,
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
  likedByFollowingUser,
  firstLiker,
};
      })
);

    res.status(200).json({
      success: true,
      count: updatedPosts.length,
      posts: updatedPosts,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editPost = async (req, res) => {
  try {
    const { description } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only owner can edit
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can edit only your own post",
      });
    }

    post.description = description;
    post.isEdited = true;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// HIDE / UNHIDE LIKE COUNT
// ==============================

export const toggleHideLikesCount = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only post owner can hide/unhide like count
    if (
      post.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can change like count visibility only for your own post",
      });
    }

    // Toggle hide/unhide
    post.hideLikesCount =
      !post.hideLikesCount;

    await post.save();

    return res.status(200).json({
      success: true,
      hideLikesCount:
        post.hideLikesCount,
      message: post.hideLikesCount
        ? "Like count hidden"
        : "Like count visible",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// TURN ON / OFF COMMENTING
// ==============================

export const toggleComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only post owner can change commenting setting
    if (
      post.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can change commenting only for your own post",
      });
    }

    post.commentsDisabled =
      !post.commentsDisabled;

    await post.save();

    return res.status(200).json({
      success: true,
      commentsDisabled:
        post.commentsDisabled,
      message: post.commentsDisabled
        ? "Commenting turned off"
        : "Commenting turned on",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// PIN / UNPIN PROFILE POST
// ==============================

export const togglePinPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only owner can pin/unpin own post
    if (
      post.user.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can pin only your own posts",
      });
    }

    // ------------------------------
    // UNPIN
    // ------------------------------
    if (post.isPinned) {
      post.isPinned = false;
      post.pinnedAt = null;

      await post.save();

      return res.status(200).json({
        success: true,
        isPinned: false,
        pinnedAt: null,
        message: "Post unpinned from main grid",
      });
    }

    // ------------------------------
    // MAXIMUM 3 PINNED POSTS
    // ------------------------------
    const pinnedPosts = await Post.find({
  user: req.user._id,
  isPinned: true,
}).sort({ pinnedAt: 1 });

// Already 3 pinned असतील तर
// सर्वात जुना pinned post automatically unpin
if (pinnedPosts.length >= 3) {
  const oldestPinnedPost = pinnedPosts[0];

  oldestPinnedPost.isPinned = false;
  oldestPinnedPost.pinnedAt = null;

  await oldestPinnedPost.save();
}


    // ------------------------------
    // PIN
    // ------------------------------
    post.isPinned = true;
    post.pinnedAt = new Date();

    await post.save();

    return res.status(200).json({
      success: true,
      isPinned: true,
      pinnedAt: post.pinnedAt,
      message: "Post pinned to main grid",
    });
  } catch (error) {
    console.error("TOGGLE PIN POST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only owner can delete
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own post",
      });
    }

    // Delete all images from Cloudinary
    for (const imageUrl of post.images) {

  const parts = imageUrl.split("/");

  const filename = parts[parts.length - 1];

  const publicId =
    "ChitChat/posts/" + filename.split(".")[0];

  await cloudinary.uploader.destroy(publicId);
}

    // Remove post from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        posts: post._id,
      },
    });

    // Delete post
    await Post.findByIdAndDelete(post._id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET POST LIKERS - OWNER ONLY
// ==============================

export const getPostLikers = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Only post owner can see liker list
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only post owner can view likes",
      });
    }

    const currentUser = await User.findById(
      req.user._id
    ).select("following");

    const likers = await User.find({
      _id: { $in: post.likes },
    }).select(
      "name username profilePic isPrivate followers following followRequests"
    );

    const formattedLikers = likers.map((liker) => {
      const isMe =
        liker._id.toString() ===
        req.user._id.toString();

      const isFollowing = (
        currentUser.following || []
      ).some(
        (id) =>
          id.toString() === liker._id.toString()
      );

      const isRequested = (
        liker.followRequests || []
      ).some(
        (id) =>
          id.toString() === req.user._id.toString()
      );

      const followsYou = (
        liker.following || []
      ).some(
        (id) =>
          id.toString() === req.user._id.toString()
      );

      return {
        _id: liker._id,
        name: liker.name,
        username: liker.username,
        profilePic: liker.profilePic,
        isPrivate: liker.isPrivate,

        isMe,
        isFollowing,
        isRequested,
        followsYou,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedLikers.length,
      likers: formattedLikers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
  (id) => id.toString() !== req.user._id.toString()
);

await post.save();

await User.findByIdAndUpdate(req.user._id, {
  $pull: {
    likedPosts: post._id,
  },
});

await Notification.findOneAndDelete({
  sender: req.user._id,
  receiver: post.user,
  post: post._id,
  type: "like",
});

const updatedPost = await Post.findById(
  post._id
);

const currentUser =
  await User.findById(req.user._id);

const likedByFollowingUser =
  await getLikedByFollowingUser(
    updatedPost,
    currentUser
  );

const firstLiker =
  await getFirstLiker(updatedPost);

return res.status(200).json({
  success: true,
  liked: false,
  likesCount: post.likes.length,
  likedByFollowingUser,
  firstLiker,
  message: "Post unliked successfully",
});
    }

    post.likes.push(req.user._id);

await post.save();

await User.findByIdAndUpdate(req.user._id, {
  $addToSet: {
    likedPosts: post._id,
  },
});

    if (post.user.toString() !== req.user._id.toString()) {
  await Notification.create({
    sender: req.user._id,
    receiver: post.user,
    type: "like",
    post: post._id,
  });

  sendPushToUser(post.user.toString(), {
    type: "like",
    title: req.user.name || "New like",
    body: `${req.user.name || "Someone"} liked your post`,
    url: `/post/${post._id}`,
    tag: `like-${post._id}`,
  });
}


const currentUser =
  await User.findById(req.user._id);

const likedByFollowingUser =
  await getLikedByFollowingUser(
    post,
    currentUser
  );

const firstLiker =
  await getFirstLiker(post);

    res.status(200).json({
  success: true,
  liked: true,
  likesCount: post.likes.length,
  likedByFollowingUser,
  firstLiker,
  message: "Post liked successfully",
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const user = await User.findById(req.user._id);

    const alreadySaved = user.savedPosts.some(
      (id) => id.toString() === post._id.toString()
    );

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== post._id.toString()
      );

      await user.save();

      return res.status(200).json({
        success: true,
        saved: false,
        message: "Post removed from saved posts",
      });
    }

    user.savedPosts.push(post._id);

    await user.save();

    res.status(200).json({
      success: true,
      saved: true,
      message: "Post saved successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate({
        path: "savedPosts",
        populate: {
          path: "user",
          select:
            "name username profilePic followRequests",
        },
      });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================
// BLOCK RELATIONSHIP FILTER
// =====================================

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

    const updatedPosts = await Promise.all(
  currentUser.savedPosts
  .filter(
    (post) =>
      post.user &&
      !blockedUserIds.includes(
        post.user._id.toString()
      )
  )
  .map(async (post) => {
        const postUser = post.user;

        const isLiked = post.likes.some(
          (id) =>
            id.toString() ===
            currentUser._id.toString()
        );

        const isFollowing =
          currentUser.following.some(
            (id) =>
              id.toString() ===
              postUser._id.toString()
          );

        const isRequested =
          postUser.followRequests?.some(
            (id) =>
              id.toString() ===
              currentUser._id.toString()
          ) || false;

          const likedByFollowingUser =
  await getLikedByFollowingUser(
    post,
    currentUser
  );

  const firstLiker =
  await getFirstLiker(post);

        return {
          ...post.toObject(),

          isLiked,
          isSaved: true,
likesCount: post.likes.length,
commentsCount: post.comments.length,
likedByFollowingUser,
firstLiker,

          user: {
            ...postUser.toObject(),
            isFollowing,
            isRequested,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: updatedPosts.length,
      posts: updatedPosts,
    });

  } catch (error) {
    console.error(
      "GET SAVED POSTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate({
        path: "likedPosts",
        populate: {
          path: "user",
          select:
            "name username profilePic followRequests",
        },
      });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =====================================
// BLOCK RELATIONSHIP FILTER
// =====================================

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

    const updatedPosts = await Promise.all(
  currentUser.likedPosts
  .filter(
    (post) =>
      post.user &&
      !blockedUserIds.includes(
        post.user._id.toString()
      )
  )
  .map(async (post) => {
        const postUser = post.user;

        const isFollowing =
          currentUser.following.some(
            (id) =>
              id.toString() ===
              postUser._id.toString()
          );

        const isRequested =
          postUser.followRequests?.some(
            (id) =>
              id.toString() ===
              currentUser._id.toString()
          ) || false;

        const isSaved =
          currentUser.savedPosts.some(
            (id) =>
              id.toString() ===
              post._id.toString()
          );

          const likedByFollowingUser =
  await getLikedByFollowingUser(
    post,
    currentUser
  );

  const firstLiker =
  await getFirstLiker(post);

        return {
          ...post.toObject(),

          // Because this post came from likedPosts
          isLiked: true,

          isSaved,

          likesCount: post.likes.length,
commentsCount: post.comments.length,
likedByFollowingUser,
firstLiker,

          user: {
            ...postUser.toObject(),
            isFollowing,
            isRequested,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: updatedPosts.length,
      posts: updatedPosts,
    });

  } catch (error) {
    console.error(
      "GET LIKED POSTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
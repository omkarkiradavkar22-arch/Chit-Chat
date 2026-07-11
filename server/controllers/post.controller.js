import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Notification from "../models/Notification.js";

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

    const liked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    const saved = currentUser.savedPosts.some(
      (id) => id.toString() === post._id.toString()
    );

    res.status(200).json({
      success: true,
      post: {
        ...post.toObject(),
        isLiked: liked,
        isSaved: saved,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
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

    const posts = await Post.find()
      .populate("user", "name username profilePic")
      .sort({ createdAt: -1 });

    const updatedPosts = posts.map((post) => {
      const liked = post.likes.some(
        (id) => id.toString() === req.user._id.toString()
      );

      const saved = currentUser.savedPosts.some(
        (id) => id.toString() === post._id.toString()
      );

      return {
  ...post.toObject(),
  isLiked: liked,
  isSaved: saved,
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
};
    });

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

    const updatedPosts = posts.map((post) => {
      const liked = post.likes.some(
        (id) => id.toString() === req.user._id.toString()
      );

      const saved = currentUser.savedPosts.some(
        (id) => id.toString() === post._id.toString()
      );

     return {
  ...post.toObject(),
  isLiked: liked,
  isSaved: saved,
  likesCount: post.likes.length,
  commentsCount: post.comments.length,
};
    });

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

return res.status(200).json({
  success: true,
  liked: false,
  likesCount: post.likes.length,
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
}


    res.status(200).json({
      success: true,
      liked: true,
      likesCount: post.likes.length,
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
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: {
        path: "user",
        select: "name username profilePic",
      },
    });

    res.status(200).json({
      success: true,
      count: user.savedPosts.length,
      posts: user.savedPosts,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "likedPosts",
      populate: {
        path: "user",
        select: "name username profilePic",
      },
    });

    res.status(200).json({
      success: true,
      count: user.likedPosts.length,
      posts: user.likedPosts,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
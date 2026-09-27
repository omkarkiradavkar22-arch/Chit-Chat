import { useState , useRef, useEffect} from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaShare,
  FaEllipsisV,
  FaBookmark,
  FaRegBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaPen,
  FaTrash,
  FaWhatsapp,
  FaLink,
  FaPaperPlane,
  FaShareAlt
} from "react-icons/fa";
import ChitChatIcon from "../icons/ChitChatIcon";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import CommentSection from "../comments/CommentSection";
import { optimizeImage } from "../../utils/optimizeImage";

function PostCard({ post, priority = false }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(Boolean(post.isLiked));

  const [
  likedByFollowingUser,
  setLikedByFollowingUser,
] = useState(post.likedByFollowingUser || null);

const [firstLiker, setFirstLiker] = useState(
  post.firstLiker || null
);

const [saved, setSaved] = useState(Boolean(post.isSaved));

const [likes, setLikes] = useState(() => {
  if (typeof post.likesCount === "number") {
    return post.likesCount;
  }

  if (Array.isArray(post.likes)) {
    return post.likes.length;
  }

  return 0;
});
const [currentImage, setCurrentImage] = useState(() => {
  if (!post.images || post.images.length <= 1) {
    return 0;
  }

  const imageKey =
    `chitchat_post_image_${post._id}`;

  const savedIndex = Number(
    localStorage.getItem(imageKey) || 0
  );

  return savedIndex % post.images.length;
});
const touchStartX = useRef(null);
const touchEndX = useRef(null);
  const [openComments, setOpenComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChatShare, setShowChatShare] = useState(false);
const [shareChats, setShareChats] = useState([]);
const [shareLoading, setShareLoading] = useState(false);

const [selectedShareChats, setSelectedShareChats] = useState([]);
const [sendingPosts, setSendingPosts] = useState(false);
  const { user } = useAuth();

  const [showHeart, setShowHeart] = useState(false);
const lastTapRef = useRef(0);

const [showLikersModal, setShowLikersModal] = useState(false);
const [postLikers, setPostLikers] = useState([]);
const [likersLoading, setLikersLoading] = useState(false);

const [likerFollowLoading, setLikerFollowLoading] =
  useState(null);

  const [isFollowing, setIsFollowing] = useState(
  post.user.isFollowing || false
);

const [isRequested, setIsRequested] = useState(
  post.user.isRequested || false
);

const [followLoading, setFollowLoading] = useState(false);

useEffect(() => {
  const handleFollowChange = (event) => {
    const {
      userId,
      isFollowing: newIsFollowing,
      isRequested: newIsRequested,
    } = event.detail || {};

    if (
      String(userId) !== String(post.user._id)
    ) {
      return;
    }

    setIsFollowing(Boolean(newIsFollowing));
    setIsRequested(Boolean(newIsRequested));
  };

  window.addEventListener(
    "chitchat-follow-change",
    handleFollowChange
  );

  return () => {
    window.removeEventListener(
      "chitchat-follow-change",
      handleFollowChange
    );
  };
}, [post.user._id]);

  const [editing, setEditing] = useState(false);
const [description, setDescription] = useState(post.description);
const [loading, setLoading] = useState(false);

const [openMenu, setOpenMenu] = useState(false);

const [hideLikesCount, setHideLikesCount] = useState(
  Boolean(post.hideLikesCount)
);

const [commentsDisabled, setCommentsDisabled] = useState(
  Boolean(post.commentsDisabled)
);

useEffect(() => {
  if (!post.images || post.images.length <= 1) {
    return;
  }

  const imageKey =
    `chitchat_post_image_${post._id}`;

  const nextImage =
    (currentImage + 1) % post.images.length;

  localStorage.setItem(
    imageKey,
    String(nextImage)
  );
}, []);

const menuRef = useRef(null);

const openLikersModal = async () => {
  // Only owner
  if (user?._id !== post.user?._id) {
    return;
  }

  try {
    setLikersLoading(true);

    const { data } = await api.get(
      `/posts/${post._id}/likers`
    );

    setPostLikers(data.likers || []);
    setShowLikersModal(true);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to load likes"
    );
  } finally {
    setLikersLoading(false);
  }
};

const handleLikerFollow = async (liker) => {
  if (likerFollowLoading) return;

  try {
    setLikerFollowLoading(liker._id);

    if (liker.isFollowing) {
      const { data } = await api.post(
        `/users/unfollow/${liker._id}`
      );

      setPostLikers((prev) =>
        prev.map((item) =>
          item._id === liker._id
            ? {
                ...item,
                isFollowing: false,
              }
            : item
        )
      );

      toast.success(data.message);
    } else if (liker.isRequested) {
      const { data } = await api.post(
        `/users/cancel-request/${liker._id}`
      );

      setPostLikers((prev) =>
        prev.map((item) =>
          item._id === liker._id
            ? {
                ...item,
                isRequested: false,
              }
            : item
        )
      );

      toast.success(data.message);
    } else {
      const { data } = await api.post(
        `/users/follow/${liker._id}`
      );

      const requestSent =
        data.message
          ?.toLowerCase()
          .includes("request");

      setPostLikers((prev) =>
        prev.map((item) =>
          item._id === liker._id
            ? {
                ...item,
                isFollowing: !requestSent,
                isRequested: requestSent,
              }
            : item
        )
      );

      toast.success(data.message);
    }

    window.dispatchEvent(
      new CustomEvent("chitchat-follow-change", {
        detail: {
          userId: liker._id,
        },
      })
    );
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to update follow"
    );
  } finally {
    setLikerFollowLoading(null);
  }
};

 const toggleLike = async () => {
  try {
    const { data } = await api.post(
      `/posts/${post._id}/toggle-like`
    );

    setLiked(data.liked);
    setLikes(data.likesCount);

    setLikedByFollowingUser(
      data.likedByFollowingUser || null
    );

    setFirstLiker(
      data.firstLiker || null
    );
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Something went wrong"
    );
  }
};

  const handleDoubleTapLike = async () => {
  const now = Date.now();
  const DOUBLE_TAP_DELAY = 300;

  if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
    // Instagram सारखं:
    // already liked असेल तर unlike करायचं नाही
    if (!liked) {
      try {
       const { data } = await api.post(
  `/posts/${post._id}/toggle-like`
);

setLiked(data.liked);
setLikes(data.likesCount);

setLikedByFollowingUser(
  data.likedByFollowingUser || null
);

setFirstLiker(
  data.firstLiker || null
);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to like post"
        );
      }
    }

    // Heart animation
    setShowHeart(true);

    setTimeout(() => {
      setShowHeart(false);
    }, 700);
  }

  lastTapRef.current = now;
};

  const handleFollow = async () => {
  if (followLoading) return;

  try {
    setFollowLoading(true);

    if (isFollowing) {
      const { data } = await api.post(
        `/users/unfollow/${post.user._id}`
      );

      setIsFollowing(false);

      toast.success(data.message);
    } else if (isRequested) {
      const { data } = await api.post(
        `/users/cancel-request/${post.user._id}`
      );

      setIsRequested(false);

      toast.success(data.message);
    } else {
      const { data } = await api.post(
        `/users/follow/${post.user._id}`
      );

      if (data.message?.toLowerCase().includes("request")) {
        setIsRequested(true);
      } else {
        setIsFollowing(true);
      }

      toast.success(data.message);
    }

  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      "Failed to update follow"
    );
  } finally {
    setFollowLoading(false);
  }
};

const toggleSave = async () => {
  try {
    const { data } = await api.post(
      `/posts/${post._id}/toggle-save`
    );

    setSaved(data.saved);

    toast.success(data.message);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to save post"
    );
  }
};

const toggleHideLikesCount = async () => {
  try {
    const { data } = await api.patch(
      `/posts/${post._id}/toggle-hide-likes`
    );

    setHideLikesCount(data.hideLikesCount);

    setOpenMenu(false);

    toast.success(data.message);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to update like count visibility"
    );
  }
};

const toggleComments = async () => {
  try {
    const { data } = await api.patch(
      `/posts/${post._id}/toggle-comments`
    );

    setCommentsDisabled(data.commentsDisabled);

    setOpenMenu(false);

    toast.success(data.message);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to update commenting"
    );
  }
};

// =============================
// SHARE POST
// =============================

const getPostUrl = () => {
  return `${window.location.origin}/post/${post._id}/comments`;
};

const getSharePreviewUrl = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL;

  return `${backendUrl}/api/share/post/${post._id}`;
};

const copyPostLink = async () => {
  const postUrl = getPostUrl();

  try {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(postUrl);
    } else {
      const textArea =
        document.createElement("textarea");

      textArea.value = postUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      document.execCommand("copy");

      document.body.removeChild(textArea);
    }

    toast.success("Post link copied!");

    setShowShareModal(false);
  } catch (error) {
    console.error("Copy error:", error);

    toast.error("Failed to copy link");
  }
};


const shareToWhatsApp = () => {
  const shareUrl = getSharePreviewUrl();

  const text = encodeURIComponent(
    `${post.description || "Check out this post on Chit-Chat"}\n\n${shareUrl}`
  );

  window.open(
    `https://wa.me/?text=${text}`,
    "_blank",
    "noopener,noreferrer"
  );

  setShowShareModal(false);
};


const openChatShare = async () => {
  try {
    setShareLoading(true);

    const { data } = await api.get("/chat");

    setShareChats(data.chats || []);
    setSelectedShareChats([]);

    setShowShareModal(false);
    setShowChatShare(true);
  } catch (error) {
    console.error("LOAD CHATS ERROR:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to load chats"
    );
  } finally {
    setShareLoading(false);
  }
};

const toggleShareChat = (chatId) => {
  setSelectedShareChats((prev) =>
    prev.includes(chatId)
      ? prev.filter((id) => id !== chatId)
      : [...prev, chatId]
  );
};

const sendPostToChats = async () => {
  if (selectedShareChats.length === 0) {
    return toast.error("Select at least one chat");
  }

  try {
    setSendingPosts(true);

    await Promise.all(
      selectedShareChats.map(async (chatId) => {
        const formData = new FormData();

        formData.append("text", "");
        formData.append("sharedPost", post._id);

        await api.post(
          `/messages/${chatId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      })
    );

    toast.success(
      `Post sent to ${selectedShareChats.length} ${
        selectedShareChats.length === 1 ? "chat" : "chats"
      }!`
    );

    setSelectedShareChats([]);
    setShowChatShare(false);

  } catch (error) {
    console.error("SEND POST ERROR:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to send post"
    );
  } finally {
    setSendingPosts(false);
  }
};

const nativeShare = async () => {
  const postUrl = getPostUrl();

  try {
    if (!navigator.share) {
      toast.error(
        "Sharing is not supported on this device"
      );
      return;
    }

    await navigator.share({
      title: "Chit-Chat Post",
      text:
        post.description ||
        "Check out this post on Chit-Chat",
      url: postUrl,
    });

    setShowShareModal(false);
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Share error:", error);

      toast.error("Failed to share post");
    }
  }
};

const deletePost = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this post?"
  );

  if (!confirmDelete) return;

  try {
    const { data } = await api.delete(
      `/posts/${post._id}`
    );

    toast.success(data.message);

    window.location.reload();

  } catch (error) {
    console.error("Delete error:", error);

    toast.error(
      error.response?.data?.message ||
        "Failed to delete post"
    );
  }
};

const updatePost = async () => {
  if (!description.trim()) {
    return toast.error("Description cannot be empty");
  }

  try {
    setLoading(true);

    const { data } = await api.put(`/posts/${post._id}`, {
      description,
    });

    toast.success(data.message);

    setEditing(false);

  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      "Failed to update post"
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  const closeMenu = (e) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target)
    ) {
      setOpenMenu(false);
    }
  };

  document.addEventListener(
    "mousedown",
    closeMenu
  );

  return () =>
    document.removeEventListener(
      "mousedown",
      closeMenu
    );
}, []);

const handleTouchStart = (e) => {
  touchStartX.current = e.touches[0].clientX;
  touchEndX.current = null;
};

const handleTouchMove = (e) => {
  touchEndX.current = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  if (
    touchStartX.current === null ||
    touchEndX.current === null
  ) {
    return;
  }

  const distance =
    touchStartX.current - touchEndX.current;

  const minSwipeDistance = 50;

  // Swipe LEFT → Next image
  if (distance > minSwipeDistance) {
    setCurrentImage((prev) =>
      prev === post.images.length - 1
        ? 0
        : prev + 1
    );
  }

  // Swipe RIGHT → Previous image
  if (distance < -minSwipeDistance) {
    setCurrentImage((prev) =>
      prev === 0
        ? post.images.length - 1
        : prev - 1
    );
  }

  touchStartX.current = null;
  touchEndX.current = null;
};

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl shadow mb-6 overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">

{/* Header */}
<div className="flex items-center justify-between p-4">

  <div
  onClick={() => navigate(`/profile/${post.user.username}`)}
  className="flex items-center gap-3 cursor-pointer"
>
    <img
      src={post.user.profilePic || "/default-profile-picture.png"}
      alt={post.user.name}
      className="w-12 h-12 rounded-full object-cover"
    />

    <div>
  <div className="flex items-center gap-2">

    <h3 className="font-semibold">
      {post.user.name}
    </h3>

    {/* Follow Button */}
    {user._id !== post.user._id && (
      <>
        <span className="text-gray-400">•</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFollow();
          }}
          disabled={followLoading}
          className={`text-sm font-semibold transition ${
            isFollowing
              ? "text-gray-500 hover:text-red-500"
              : isRequested
              ? "text-gray-500 hover:text-red-500"
              : "text-blue-600 hover:text-blue-700"
          }`}
        >
          {followLoading
            ? "..."
            : isFollowing
            ? "Following"
            : isRequested
            ? "Requested"
            : "Follow"}
        </button>
      </>
    )}

  </div>

  <p className="text-sm text-gray-500">
    @{post.user.username}
  </p>
</div>
  </div>

  {user._id === post.user._id && (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpenMenu(!openMenu)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <FaEllipsisV />
      </button>

      {openMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
         <button
  onClick={() => {
    setEditing(true);
    setOpenMenu(false);
  }}
  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
>
  <FaPen className="text-blue-600" />
  <span>Edit Post</span>
</button>


<button
  onClick={toggleHideLikesCount}
  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
>
  {hideLikesCount ? (
    <>
      <FaRegHeart className="text-blue-600" />
      <span>Unhide like count</span>
    </>
  ) : (
    <>
      <FaRegHeart className="text-gray-600 dark:text-gray-300" />
      <span>Hide like count</span>
    </>
  )}
</button>

<button
  onClick={toggleComments}
  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
>
  <FaRegComment className="text-gray-600 dark:text-gray-300" />

  <span>
    {commentsDisabled
      ? "Turn on commenting"
      : "Turn off commenting"}
  </span>
</button>

          <button
  onClick={deletePost}
  className="w-full flex items-center gap-3 text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
>
  <FaTrash />
  <span>Delete Post</span>
</button>
        </div>
      )}
    </div>
  )}

</div>
      
      {/* Images */}
{post.images?.length > 0 && (
 <div
  className="relative select-none"
  onClick={handleDoubleTapLike}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  <img
  src={optimizeImage(post.images[currentImage], 900)}
  alt={post.description || "Chit-Chat post"}
  loading={priority ? "eager" : "lazy"}
  fetchPriority={priority ? "high" : "auto"}
  decoding="async"
  className="w-full max-h-[600px] object-contain bg-black"
/>

  {showHeart && (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <FaHeart
        className="text-white drop-shadow-2xl animate-heart-pop"
        size={90}
      />
    </div>
  )}

    {post.images.length > 1 && (
      <>
        <button
          onClick={(e) => {
  e.stopPropagation();

  setCurrentImage((prev) =>
    prev === 0 ? post.images.length - 1 : prev - 1
  );
}}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-3 py-2"
        >
        <FaChevronLeft size={22} />
        </button>

        <button
          onClick={(e) => {
  e.stopPropagation();

  setCurrentImage((prev) =>
    prev === post.images.length - 1 ? 0 : prev + 1
  );
}}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-3 py-2"
        >
          <FaChevronRight size={22} />
        </button>

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded">
          {currentImage + 1}/{post.images.length}
        </div>
      </>
    )}

  </div>
)}

      {/* Actions */}
      <div className="flex justify-between items-center px-5 py-4">

  <div className="flex gap-5 text-xl text-gray-700 dark:text-gray-200">

    <button onClick={toggleLike}>
      {liked ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart />
      )}
    </button>

  {(user._id === post.user._id || !commentsDisabled) && (
  <button
    onClick={() =>
      navigate(`/post/${post._id}/comments`)
    }
    className="flex items-center gap-2"
  >
    <span>{commentsCount}</span>
    <FaRegComment />
  </button>
)}

<button
  onClick={() => setShowShareModal(true)}
  title="Share post"
>
  <FaShare />
</button>

  </div>

  <button onClick={toggleSave}>
    {saved ? (
      <FaBookmark className="text-xl" />
    ) : (
      <FaRegBookmark className="text-xl" />
    )}
  </button>

</div>
      {/* Stats */}
      <div className="px-5 pb-5">

        {Number(likes) > 0 && (
  <>
    {(user._id === post.user._id || !hideLikesCount) && (
  <>
    {user._id === post.user._id ? (
      <button
        type="button"
        onClick={openLikersModal}
        disabled={likersLoading}
        className="font-semibold text-gray-900 dark:text-white  cursor-pointer"
      >
        {likes} {Number(likes) === 1 ? "Like" : "Likes"}
      </button>
    ) : (
      <p className="font-semibold text-gray-900 dark:text-white">
        {likes} {Number(likes) === 1 ? "Like" : "Likes"}
      </p>
    )}
  </>
)}

    {(likedByFollowingUser || firstLiker) && (
  <p className="text-sm text-gray-500 dark:text-gray-400">
    Liked by{" "}
    <span className="font-semibold text-gray-900 dark:text-white">
      {likedByFollowingUser?.name ||
        firstLiker?.name}
    </span>

    {Number(likes) > 1 && " and others"}
  </p>
)}
  </>
)}

        {editing ? (
  <div className="mt-2">

    <textarea
      value={description}
      onChange={(e) =>
        setDescription(e.target.value)
      }
      rows={3}
      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-3 resize-none outline-none focus:border-blue-500 transition"
    />

    <div className="flex justify-end gap-3 mt-3">

      <button
        onClick={() => {
          setEditing(false);
          setDescription(post.description);
        }}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        Cancel
      </button>

      <button
        onClick={updatePost}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50 transition"
      >
        {loading ? "Saving..." : "Save"}
      </button>

    </div>

  </div>
) : (
  <p className="mt-2 text-gray-800 dark:text-gray-200">
    <span className="font-semibold">
      {post.user.name}
    </span>{" "}
    {description}
  </p>
)}

      </div>

{openComments && (
  <div className="border-t border-gray-200 dark:border-gray-700">
    <CommentSection
      post={post}
      setCommentsCount={setCommentsCount}
    />
  </div>
)}

{showLikersModal && (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120]"
    onClick={() => setShowLikersModal(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        bg-white dark:bg-gray-900
        w-[90%] max-w-sm
        max-h-[70vh]
        rounded-2xl
        shadow-xl
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">
          Liked by 
        </h2>

        <button
          onClick={() => setShowLikersModal(false)}
          className="text-2xl text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Users */}
      <div className="overflow-y-auto max-h-[55vh]">
       {postLikers.map((liker) => (
  <div
    key={liker._id}
    className="flex items-center justify-between gap-3 px-4 py-3"
  >
    {/* USER INFO */}
    <div
      onClick={() => {
        setShowLikersModal(false);
        navigate(`/profile/${liker.username}`);
      }}
      className="flex items-center gap-3 min-w-0 cursor-pointer"
    >
      <img
        src={
          liker.profilePic ||
          "/default-profile-picture.png"
        }
        alt={liker.name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />

      <div className="min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {liker.name}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          @{liker.username}
        </p>
      </div>
    </div>

    {/* FOLLOW BUTTON */}
    {!liker.isMe && (
      <button
        type="button"
        disabled={
          likerFollowLoading === liker._id
        }
        onClick={() =>
          handleLikerFollow(liker)
        }
        className={`text-sm font-semibold flex-shrink-0 transition ${
          liker.isFollowing ||
          liker.isRequested
            ? "text-gray-500 dark:text-gray-400"
            : "text-blue-600 hover:text-blue-700"
        }`}
      >
        {likerFollowLoading === liker._id
          ? "..."
          : liker.isFollowing
          ? "Following"
          : liker.isRequested
          ? "Requested"
          : liker.followsYou
          ? "Follow Back"
          : "Follow"}
      </button>
    )}
  </div>
))}
      </div>
    </div>
  </div>
)}

{showShareModal && (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
    onClick={() => setShowShareModal(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-900 w-[90%] max-w-sm rounded-2xl shadow-xl p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">
          Share Post
        </h2>

        <button
          onClick={() => setShowShareModal(false)}
          className="text-2xl text-gray-500 hover:text-gray-800 dark:hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">

  <button
  onClick={openChatShare}
  className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
>
  <ChitChatIcon
    size={22}
    className="text-blue-500"
  />

  <span>Chit-Chat</span>
</button>

  <button
    onClick={shareToWhatsApp}
    className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
  >
    <FaWhatsapp className="text-green-500 text-xl" />
    <span>WhatsApp</span>
  </button>

  <button
    onClick={copyPostLink}
    className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
  >
    <FaLink className="text-gray-600 dark:text-gray-300 text-xl" />
    <span>Copy Link</span>
  </button>

      <button
  onClick={nativeShare}
   className="flex items-center gap-3 p-4 rounded-xl bg-blue-100 dark:bg-blue-800 hover:bg-gray-200 dark:hover:bg-blue-700 transition"
>
  <FaShareAlt className="text-lg" />
  <span>More Share</span>
</button>
</div>

    </div>
  </div>
)}

{showChatShare && (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110]"
    onClick={() => setShowChatShare(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        bg-white dark:bg-gray-900
        w-[90%] max-w-md
        max-h-[70vh]
        rounded-2xl
        shadow-xl
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">
          Send to
        </h2>

        <button
          onClick={() => setShowChatShare(false)}
          className="text-2xl text-gray-500"
        >
          ×
        </button>
      </div>

      {/* Chats */}
<div className="overflow-y-auto max-h-[55vh]">
  {shareLoading ? (
    <p className="text-center py-6 text-gray-500">
      Loading chats...
    </p>
  ) : shareChats.length === 0 ? (
    <p className="text-center py-6 text-gray-500">
      No chats found
    </p>
  ) : (
    shareChats.map((chat) => {
      const selected = selectedShareChats.includes(chat._id);

      return (
        <button
          key={chat._id}
          onClick={() => toggleShareChat(chat._id)}
          disabled={sendingPosts}
          className={`
            w-full
            flex items-center
            gap-3
            px-4 py-3
            text-left
            transition
            ${
              selected
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          `}
        >
          <img
            src={
              chat.otherUser?.profilePic ||
              "/default-profile-picture.png"
            }
            alt={chat.otherUser?.name || ""}
            className="w-11 h-11 rounded-full object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {chat.otherUser?.name}
            </p>

            <p className="text-sm text-gray-500 truncate">
              @{chat.otherUser?.username}
            </p>
          </div>

          <div
            className={`
              w-6 h-6
              rounded-full
              border-2
              flex items-center justify-center
              ${
                selected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-400 dark:border-gray-500"
              }
            `}
          >
            {selected && (
              <span className="text-sm font-bold">✓</span>
            )}
          </div>
        </button>
      );
    })
  )}
</div>
{shareChats.length > 0 && (
  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
    <button
      onClick={sendPostToChats}
      disabled={
        selectedShareChats.length === 0 ||
        sendingPosts
      }
      className="
        w-full
        bg-blue-600
        hover:bg-blue-700
        disabled:bg-gray-300
        dark:disabled:bg-gray-700
        disabled:cursor-not-allowed
        text-white
        font-semibold
        py-3
        rounded-xl
        transition
      "
    >
      {sendingPosts
        ? "Sending..."
        : selectedShareChats.length > 0
        ? `Send (${selectedShareChats.length})`
        : "Send"}
    </button>
  </div>
)}
    </div>
  </div>
)}

    </div>
  );
}

export default PostCard;

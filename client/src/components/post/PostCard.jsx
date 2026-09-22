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
  FaTrash
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import CommentSection from "../comments/CommentSection";
import { optimizeImage } from "../../utils/optimizeImage";

function PostCard({ post, priority = false }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(Boolean(post.isLiked));

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
const [currentImage, setCurrentImage] = useState(0);
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

  const [isFollowing, setIsFollowing] = useState(
  post.user.isFollowing || false
);

const [isRequested, setIsRequested] = useState(
  post.user.isRequested || false
);

const [followLoading, setFollowLoading] = useState(false);

  const [editing, setEditing] = useState(false);
const [description, setDescription] = useState(post.description);
const [loading, setLoading] = useState(false);

const [openMenu, setOpenMenu] = useState(false);

const menuRef = useRef(null);
  const toggleLike = async () => {
    try {
      await api.post(`/posts/${post._id}/toggle-like`);

     if (liked) {
  setLikes((prev) =>
    Math.max(0, Number(prev) - 1)
  );
} else {
  setLikes((prev) =>
    Number(prev) + 1
  );
}

      setLiked(!liked);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
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
        await api.post(`/posts/${post._id}/toggle-like`);

setLiked(true);
setLikes((prev) => Number(prev) + 1);
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

const shareToInstagram = async () => {
  const shareUrl = getSharePreviewUrl();

  try {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(shareUrl);
    }

    toast.success(
      "Post link copied! Paste it in Instagram."
    );

    setShowShareModal(false);

    window.open(
      "https://www.instagram.com/",
      "_blank",
      "noopener,noreferrer"
    );
  } catch (error) {
    toast.error("Failed to prepare Instagram share");
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

const shareToFacebook = () => {
 const postUrl = encodeURIComponent(
  getSharePreviewUrl()
);

  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`,
    "_blank",
    "noopener,noreferrer"
  );

  setShowShareModal(false);
};

const shareToTelegram = () => {
  const postUrl = encodeURIComponent(
  getSharePreviewUrl()
);

  const text = encodeURIComponent(
    post.description ||
      "Check out this post on Chit-Chat"
  );

  window.open(
    `https://t.me/share/url?url=${postUrl}&text=${text}`,
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
      {/* Images */}
{post.images?.length > 0 && (
  <div
  className="relative select-none"
  onClick={handleDoubleTapLike}
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
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-3 py-2"
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
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-3 py-2"
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

   <button
  onClick={() => navigate(`/post/${post._id}/comments`)}
  className="flex items-center gap-2"
>
  <span>{commentsCount}</span>
  <FaRegComment />

</button>

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

        <p className="font-semibold text-gray-900 dark:text-white">
          {likes} Likes
        </p>

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
  className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
>
  💬 Send in Chit-Chat
</button>

<button
  onClick={shareToInstagram}
  className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
>
  📸 Instagram
</button>

        <button
          onClick={shareToWhatsApp}
          className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          🟢 WhatsApp
        </button>

        <button
          onClick={shareToFacebook}
          className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          🔵 Facebook
        </button>

        <button
          onClick={shareToTelegram}
          className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          ✈️ Telegram
        </button>

        <button
          onClick={copyPostLink}
          className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          🔗 Copy Link
        </button>

      </div>

      <button
        onClick={nativeShare}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
      >
        More Share Options
      </button>
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

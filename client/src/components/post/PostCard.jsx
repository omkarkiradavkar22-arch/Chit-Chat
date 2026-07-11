import { useState , useRef, useEffect} from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaShare,
  FaEllipsisV,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import CommentModal from "../comments/CommentModal";
import { useAuth } from "../../context/AuthContext";

function PostCard({ post }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likes, setLikes] = useState(post.likesCount);
  const [currentImage, setCurrentImage] = useState(0);
  const [openComments, setOpenComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
const [description, setDescription] = useState(post.description);
const [loading, setLoading] = useState(false);

const [openMenu, setOpenMenu] = useState(false);

const menuRef = useRef(null);
  const toggleLike = async () => {
    try {
      await api.post(`/posts/${post._id}/toggle-like`);

      if (liked) {
        setLikes((prev) => prev - 1);
      } else {
        setLikes((prev) => prev + 1);
      }

      setLiked(!liked);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
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

  const deletePost = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this post?"
  );

  if (!confirmDelete) return;

  try {
    console.log("Deleting post:", post._id);

    const { data } = await api.delete(`/posts/${post._id}`);

    console.log(data);

    toast.success(data.message);

    window.location.reload();

  } catch (error) {
    console.log(error);
    console.log(error.response);

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
    <div className="bg-white rounded-2xl shadow mb-6 overflow-hidden">

{/* Header */}
<div className="flex items-center justify-between p-4">

  <div
  onClick={() => navigate(`/profile/${post.user.username}`)}
  className="flex items-center gap-3 cursor-pointer"
>
    <img
      src={post.user.profilePic}
      alt={post.user.name}
      className="w-12 h-12 rounded-full object-cover"
    />

    <div>
      <h3 className="font-semibold">
        {post.user.name}
      </h3>

      <p className="text-sm text-gray-500">
        @{post.user.username}
      </p>
    </div>
  </div>

  {user._id === post.user._id && (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpenMenu(!openMenu)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <FaEllipsisV />
      </button>

      {openMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg z-50">
         <button
  onClick={() => {
    setEditing(true);
    setOpenMenu(false);
  }}
  className="w-full text-left px-4 py-3 hover:bg-gray-100"
>
  ✏️ Edit Post
</button>

          <button
  onClick={deletePost}
  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
>
  🗑 Delete Post
</button>
        </div>
      )}
    </div>
  )}

</div>
      
      {/* Images */}
      {/* Images */}
{post.images?.length > 0 && (
  <div className="relative">

    <img
      src={post.images[currentImage]}
      alt=""
      className="w-full max-h-[600px] object-cover"
    />

    {post.images.length > 1 && (
      <>
        <button
          onClick={() =>
            setCurrentImage((prev) =>
              prev === 0 ? post.images.length - 1 : prev - 1
            )
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-3 py-2"
        >
          ◀
        </button>

        <button
          onClick={() =>
            setCurrentImage((prev) =>
              prev === post.images.length - 1 ? 0 : prev + 1
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-3 py-2"
        >
          ▶
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

  <div className="flex gap-5 text-xl">

    <button onClick={toggleLike}>
      {liked ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart />
      )}
    </button>

    <button
      onClick={() => navigate(`/post/${post._id}`)}
      className="flex items-center gap-2"
    >
      <span>{commentsCount}</span>
      <FaRegComment />
    </button>

    <button>
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

        <p className="font-semibold">
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
      className="w-full border rounded-lg p-3 resize-none outline-none"
    />

    <div className="flex justify-end gap-3 mt-3">

      <button
        onClick={() => {
          setEditing(false);
          setDescription(post.description);
        }}
        className="px-4 py-2 rounded-lg border"
      >
        Cancel
      </button>

      <button
        onClick={updatePost}
        disabled={loading}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>

    </div>

  </div>
) : (
  <p className="mt-2">
    <span className="font-semibold">
      {post.user.name}
    </span>{" "}
    {description}
  </p>
)}

      </div>

      <CommentModal
  open={openComments}
  onClose={() => setOpenComments(false)}
  post={post}
  setCommentsCount={setCommentsCount}
/>

    </div>
  );
}

export default PostCard;
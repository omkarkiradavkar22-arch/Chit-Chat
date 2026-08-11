import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

function CommentSection({ post }) {
  const { user } = useAuth();
const { theme } = useTheme();

const darkMode = theme === "dark";

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const navigate = useNavigate();

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/comments/${post._id}`);

      setComments(data.comments);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load comments"
      );
    }
  };

  const addComment = async () => {
    if (!text.trim()) {
      return toast.error("Please write a comment");
    }

    try {
      setLoading(true);

      const { data } = await api.post(
        `/comments/${post._id}`,
        {
          text,
        }
      );

      setComments((prev) => [data.comment, ...prev]);

      setText("");

      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to add comment"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateComment = async () => {
    if (!editText.trim()) {
      return toast.error("Comment cannot be empty");
    }

    try {
      const { data } = await api.put(
        `/comments/${editingId}`,
        {
          text: editText,
        }
      );

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === editingId
            ? {
                ...comment,
                text: data.comment.text,
                isEdited: true,
              }
            : comment
        )
      );

      setEditingId(null);
      setEditText("");

      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update comment"
      );
    }
  };

  const deleteComment = async (id) => {
    try {
      const { data } = await api.delete(`/comments/${id}`);

      setComments((prev) =>
        prev.filter((comment) => comment._id !== id)
      );

      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete comment"
      );
    }
  };

  useEffect(() => {
    loadComments();
  }, [post._id]);

  return (
    <div
  className={`w-full min-w-0 max-w-full box-border rounded-2xl shadow mt-5 p-4 sm:p-5 border transition-colors ${
        darkMode
          ? "bg-[#111827] border-gray-700 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* =========================
          TITLE
      ========================= */}
     <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white">
  Comments ({comments.length})
</h2>

      {/* =========================
          COMMENTS
      ========================= */}
      {comments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
  No comments yet.
</p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment._id}
            className="flex gap-3 mb-4"
          >
            {/* PROFILE IMAGE */}
            <img
              onClick={() =>
                navigate(
                  `/profile/${comment.user.username}`
                )
              }
              src={comment.user.profilePic || "/default-profile-picture.png"}
              alt=""
              className="w-10 h-10 rounded-full object-cover cursor-pointer shrink-0"
            />

            <div className="flex-1 min-w-0">
              {/* NAME + EDITED */}
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">
  {comment.user.name}
</p>

                {comment.isEdited && (
                 <span className="text-xs text-gray-500 dark:text-gray-400">
  (edited)
</span>
                )}
              </div>

              {/* =========================
                  EDIT MODE
              ========================= */}
             {editingId === comment._id ? (
  <div className="w-full min-w-0 mt-1">
    <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
      
      <input
        type="text"
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        className={`flex-1 min-w-0 w-full border rounded-lg px-3 py-2 outline-none transition ${
          darkMode
            ? "bg-[#1f2937] border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
        }`}
      />

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={updateComment}
          className="text-blue-500 hover:text-blue-400 font-semibold text-sm"
        >
          Save
        </button>

        <button
          onClick={() => {
            setEditingId(null);
            setEditText("");
          }}
          className={`text-sm ${
            darkMode
              ? "text-gray-400 hover:text-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
) : (
                <>
                  {/* COMMENT TEXT */}
                  <p className="text-gray-800 dark:text-gray-200">
  {comment.text}
</p>

                  {/* ACTIONS */}
                  <div className="flex gap-4 mt-2 text-sm">
                    {/* EDIT */}
                    {user._id === comment.user._id && (
                      <button
                        onClick={() => {
                          setEditingId(comment._id);
                          setEditText(comment.text);
                        }}
                        className="text-blue-600 dark:text-blue-400"
                      >
                        Edit
                      </button>
                    )}

                    {/* DELETE */}
                    {(user._id === comment.user._id ||
                      user._id === post.user._id) && (
                      <button
                        onClick={() =>
                          deleteComment(comment._id)
                        }
                        className="text-red-600 dark:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))
      )}

      {/* =========================
          ADD COMMENT
      ========================= */}
     <div
  className={`border-t pt-4 mt-4 flex items-center gap-2 sm:gap-3 min-w-0 w-full ${
    darkMode
      ? "border-gray-700"
      : "border-gray-200"
  }`}
>
        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
         className={`flex-1 min-w-0 w-0 border rounded-lg px-3 sm:px-4 py-2 outline-none transition ${
            darkMode
              ? "bg-[#1f2937] border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
          }`}
        />

        <button
          onClick={addComment}
          disabled={loading}
        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 rounded-lg disabled:opacity-50 transition"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}

export default CommentSection;

import React from "react";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function CommentModal({
  open,
  onClose,
  post,
  setCommentsCount,
}) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const { user, darkMode } = useAuth();

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
      setCommentsCount((prev) => prev + 1);

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

  const deleteComment = async (commentId) => {
    try {
      const { data } = await api.delete(
        `/comments/${commentId}`
      );

      setComments((prev) =>
        prev.filter(
          (comment) => comment._id !== commentId
        )
      );

      setCommentsCount((prev) => prev - 1);

      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete comment"
      );
    }
  };

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="inset-0 z-50 flex items-center justify-center">

      <div
        className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border transition-colors ${
          darkMode
            ? "bg-[#111827] border-gray-700 text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >

        {/* =========================
            HEADER
        ========================= */}
        <div
          className={`flex items-center justify-between border-b p-4 ${
            darkMode
              ? "border-gray-700"
              : "border-gray-200"
          }`}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
  Comments
</h2>

          <button
            onClick={onClose}
            className={`text-2xl transition ${
              darkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            ✕
          </button>
        </div>

        {/* =========================
            COMMENTS
        ========================= */}
        <div className="h-[400px] overflow-y-auto p-4">

          {comments.length === 0 ? (
            <p
              className={`text-center ${
                darkMode
                  ? "text-gray-500"
                  : "text-gray-500"
              }`}
            >
              No comments yet.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className="flex gap-3 mb-4"
              >

                {/* PROFILE */}
                <img
                  src={comment.user.profilePic || "/default-profile-picture.png"}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">

                  {/* USER NAME */}
                  <p className="font-semibold text-gray-900 dark:text-white">
  {comment.user.name}
</p>

                  {/* EDIT MODE */}
                  {editingId === comment._id ? (
                    <div className="flex gap-2 mt-1">

                      <input
                        type="text"
                        value={editText}
                        onChange={(e) =>
                          setEditText(e.target.value)
                        }
                        className={`flex-1 border rounded-lg px-3 py-1 outline-none transition ${
                          darkMode
                            ? "bg-[#1f2937] border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        }`}
                      />

                      <button
                        onClick={updateComment}
                        className="text-blue-500 hover:text-blue-400 font-semibold"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                        className={
                          darkMode
                            ? "text-gray-400 hover:text-gray-200"
                            : "text-gray-500 hover:text-gray-700"
                        }
                      >
                        Cancel
                      </button>

                    </div>
                  ) : (
                    <>
                      {/* COMMENT TEXT */}
                      <p className="text-gray-800 dark:text-gray-200">
  {comment.text}
</p>

                      {/* ACTIONS */}
                      <div className="flex gap-4 mt-1 text-sm">

                        {comment.user._id === user._id && (
                          <button
                            onClick={() => {
                              setEditingId(comment._id);
                              setEditText(comment.text);
                            }}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            Edit
                          </button>
                        )}

                        {(comment.user._id === user._id ||
                          post.user._id === user._id) && (
                          <button
                            onClick={() =>
                              deleteComment(comment._id)
                            }
                            className="text-red-500 hover:text-red-400"
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

        </div>

        {/* =========================
            ADD COMMENT
        ========================= */}
        <div
          className={`border-t p-4 flex gap-3 ${
            darkMode
              ? "border-gray-700"
              : "border-gray-200"
          }`}
        >

          <input
            type="text"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            className={`flex-1 border rounded-lg px-4 py-2 outline-none transition ${
              darkMode
                ? "bg-[#1f2937] border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            }`}
          />

          <button
            onClick={addComment}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-lg disabled:opacity-50 transition"
          >
            {loading ? "Posting..." : "Post"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default CommentModal;
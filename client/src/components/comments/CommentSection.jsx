import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function CommentSection({ post }) {
    const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
const [editText, setEditText] = useState("");
const navigate = useNavigate();

  const loadComments = async () => {
    try {
      const { data } = await api.get(
        `/comments/${post._id}`
      );

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
    const { data } = await api.delete(
      `/comments/${id}`
    );

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
    <div className="bg-white rounded-2xl shadow mt-5 p-5">

      <h2 className="text-xl font-semibold mb-5">
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="text-gray-500">
          No comments yet.
        </p>
      ) : (
        comments.map((comment) => (
          <div
            key={comment._id}
            className="flex gap-3 mb-4">
            <img
              onClick={() => navigate(`/profile/${comment.user.username}`)}
              src={comment.user.profilePic}
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
            />

            <div className="flex-1">

            <div className="flex items-center gap-2">
             <p className="font-semibold">
               {comment.user.name}
            </p>

             {comment.isEdited && (
                <span className="text-xs text-gray-500">
                 (edited)
                </span>
              )}
            </div>

               {editingId === comment._id ? (
           <div className="flex gap-2 mt-2">
      <input
        value={editText}
        onChange={(e) =>
          setEditText(e.target.value)
        }
        className="flex-1 border rounded-lg px-3 py-1"
      />

      <button
        onClick={updateComment}
        className="text-blue-600 font-semibold"
      >
        Save
      </button>

      <button
        onClick={() => {
          setEditingId(null);
          setEditText("");
        }}
        className="text-gray-500"
      >
        Cancel
      </button>
    </div>
  ) : (
    <>
      <p>{comment.text}</p>

      <div className="flex gap-4 mt-2 text-sm">

        {/* Edit → Only Comment Owner */}
        {user._id === comment.user._id && (
          <button
            onClick={() => {
              setEditingId(comment._id);
              setEditText(comment.text);
            }}
            className="text-blue-600"
          >
            Edit
          </button>
        )}

        {/* Delete → Comment Owner OR Post Owner */}
        {(user._id === comment.user._id ||
          user._id === post.user._id) && (
          <button
            onClick={() =>
              deleteComment(comment._id)
            }
            className="text-red-600"
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

      <div className="border-t pt-4 mt-4 flex gap-3">
  <input
    type="text"
    placeholder="Write a comment..."
    value={text}
    onChange={(e) => setText(e.target.value)}
    className="flex-1 border rounded-lg px-4 py-2 outline-none"
  />

  <button
    onClick={addComment}
    disabled={loading}
    className="bg-blue-600 text-white px-5 rounded-lg disabled:opacity-50"
  >
    {loading ? "Posting..." : "Post"}
  </button>
</div>

    </div>
  );
}

export default CommentSection;
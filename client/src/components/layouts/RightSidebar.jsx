import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";

function RightSidebar() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoadingId, setFollowLoadingId] = useState(null);

  const dismissedSuggestionIdsRef = useRef(new Set());

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get(
  "/users/suggestions/list"
);

        setSuggestions(data.users || []);
      } catch (error) {
        console.error(
          "Failed to fetch suggested users:",
          error
        );

        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollow = async (userId) => {
  if (followLoadingId) return;

  try {
    setFollowLoadingId(userId);

    const { data } = await api.post(
      `/users/follow/${userId}`
    );

    const requestSent =
      data.message
        ?.toLowerCase()
        .includes("request") || false;

    // Tell every PostCard that follow state changed
    window.dispatchEvent(
      new CustomEvent("chitchat-follow-change", {
        detail: {
          userId: String(userId),
          isFollowing: !requestSent,
          isRequested: requestSent,
        },
      })
    );

    // Remove user from suggestions immediately
    if (requestSent) {
  setSuggestions((prev) =>
    prev.map((suggestedUser) =>
      suggestedUser._id === userId
        ? {
            ...suggestedUser,
            isRequested: true,
          }
        : suggestedUser
    )
  );
} else {
  setSuggestions((prev) =>
    prev.filter(
      (suggestedUser) =>
        suggestedUser._id !== userId
    )
  );
}

    toast.success(data.message);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      "Failed to follow user"
    );
  } finally {
    setFollowLoadingId(null);
  }
};

const handleDismiss = async (userId) => {
  const dismissedIndex = suggestions.findIndex(
    (user) => user._id === userId
  );

  if (dismissedIndex === -1) return;

  // Remember this dismissed user
  dismissedSuggestionIdsRef.current.add(
    String(userId)
  );

  // Exclude:
  // 1. All previously dismissed users
  // 2. All currently visible users
  const excludeIds = [
    ...dismissedSuggestionIdsRef.current,
    ...suggestions.map((user) =>
      String(user._id)
    ),
  ];

  try {
    const { data } = await api.get(
      `/users/suggestions/list?exclude=${[
        ...new Set(excludeIds),
      ].join(",")}`
    );

    const replacementUser =
      data.users?.[0] || null;

    setSuggestions((prev) => {
      const updated = [...prev];

      if (replacementUser) {
        // Replace at exactly same position
        updated[dismissedIndex] =
          replacementUser;
      } else {
        // No eligible users left
        updated.splice(dismissedIndex, 1);
      }

      return updated;
    });
  } catch (error) {
    console.error(
      "Failed to load replacement suggestion:",
      error
    );

    setSuggestions((prev) =>
      prev.filter(
        (user) => user._id !== userId
      )
    );
  }
};

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow dark:shadow-black/30 p-5 sticky top-20 border border-gray-200 dark:border-gray-800 transition-colors">

      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Suggested Users
      </h2>

      <div className="space-y-4">

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading suggestions...
          </p>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestedUser) => (
            <div
              key={suggestedUser._id}
              className="flex items-center justify-between gap-3"
            >
              <Link
                to={`/profile/${suggestedUser.username}`}
                className="flex items-center gap-3 min-w-0"
              >
                <img
                  src={
                    suggestedUser.profilePic ||
                    "/default-profile-picture.png"
                  }
                  alt={suggestedUser.username}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />

                <div className="min-w-0">
  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
    {suggestedUser.name}
  </h3>

  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
    @{suggestedUser.username}
  </p>

  {suggestedUser.followedBy?.length > 0 && (
    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
      Followed by{" "}
      <span className="font-medium">
        {suggestedUser.followedBy[0].name}
      </span>

      {suggestedUser.followedBy.length > 1 &&
        ` and ${
          suggestedUser.followedBy.length - 1
        } ${
          suggestedUser.followedBy.length - 1 === 1
            ? "other"
            : "others"
        }`}
    </p>
  )}
</div>
              </Link>

              <div className="flex items-center gap-3 shrink-0">
  <button
    type="button"
    onClick={() => {
  if (!suggestedUser.isRequested) {
    handleFollow(suggestedUser._id);
  }
}}
    disabled={
  followLoadingId === suggestedUser._id ||
  suggestedUser.isRequested
}
    className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {followLoadingId === suggestedUser._id
  ? "Following..."
  : suggestedUser.isRequested
  ? "Requested"
  : suggestedUser.followsYou
  ? "Follow Back"
  : "Follow"}
  </button>

  <button
  type="button"
  onClick={() =>
    handleDismiss(suggestedUser._id)
  }
  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
  title="Dismiss suggestion"
  aria-label={`Dismiss ${suggestedUser.name}`}
>
  <FaTimes size={16} />
</button>
</div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No suggestions available
          </p>
        )}

      </div>
    </div>
  );
}

export default RightSidebar;

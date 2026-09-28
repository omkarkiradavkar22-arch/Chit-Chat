const HOME_FEED_CACHE_KEY = "chitchat_home_feed_cache";

const getCachedHomeFeed = () => {
  try {
    const cachedFeed =
      localStorage.getItem(HOME_FEED_CACHE_KEY);

    if (!cachedFeed) return [];

    return JSON.parse(cachedFeed) || [];
  } catch (error) {
    console.error(
      "Failed to read Home feed cache:",
      error
    );

    return [];
  }
};

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

import Layout from "../components/layouts/Layout";
import CreatePost from "../components/post/CreatePost";
import PostCard from "../components/post/PostCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Home() {
 const [posts, setPosts] =
  useState(() => getCachedHomeFeed());

  const [mobileSuggestions, setMobileSuggestions] =
  useState([]);

const [
  suggestionFollowLoadingId,
  setSuggestionFollowLoadingId,
] = useState(null);

const dismissedSuggestionIdsRef = useRef(new Set());

useEffect(() => {
  const fetchMobileSuggestions = async () => {
    try {
      const { data } = await api.get(
        "/users/suggestions/list"
      );

      setMobileSuggestions(data.users || []);
    } catch (error) {
      console.error(
        "Failed to fetch mobile suggestions:",
        error
      );

      setMobileSuggestions([]);
    }
  };

  fetchMobileSuggestions();
}, []);

// Only next-page/infinite-scroll loading
const [loadingMore, setLoadingMore] =
  useState(false);

  // Current page
  const [page, setPage] = useState(1);

  // Are more posts available?
  const [hasMore, setHasMore] = useState(true);

  // Prevent multiple simultaneous requests
  const fetchingRef = useRef(false);

  // Element at bottom of feed
  const observerRef = useRef(null);

  // ---------------------------------------
  // FETCH FEED
  // ---------------------------------------
  const getFeed = useCallback(async (pageNumber) => {
  if (fetchingRef.current) return;

  try {
    fetchingRef.current = true;

    if (pageNumber > 1) {
  setLoadingMore(true);
}

    const { data } = await api.get(
      `/posts/feed?page=${pageNumber}&limit=10`
    );

    if (pageNumber === 1) {
      setPosts(data.posts);

      // Save latest first page for offline use
      try {
        localStorage.setItem(
          HOME_FEED_CACHE_KEY,
          JSON.stringify(data.posts)
        );
      } catch (cacheError) {
        console.log(
          "Could not cache home feed:",
          cacheError
        );
      }
    } else {
      setPosts((prevPosts) => {
        const existingIds = new Set(
          prevPosts.map((post) => post._id)
        );

        const newPosts = data.posts.filter(
          (post) => !existingIds.has(post._id)
        );

        return [...prevPosts, ...newPosts];
      });
    }

    setHasMore(data.hasMore);
  } catch (error) {
    // ---------------------------------------
    // OFFLINE FALLBACK
    // ---------------------------------------
    if (pageNumber === 1 && !navigator.onLine) {
      try {
        const cachedFeed =
          localStorage.getItem(HOME_FEED_CACHE_KEY);

        if (cachedFeed) {
          const cachedPosts = JSON.parse(cachedFeed);

          setPosts(cachedPosts);
          setHasMore(false);

          console.log(
            "📦 Loaded Home feed from offline cache"
          );

          return;
        }
      } catch (cacheError) {
        console.error(
          "Failed to read cached feed:",
          cacheError
        );
      }
    }

    // Don't show repeated errors while offline
    if (navigator.onLine) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load feed"
      );
    }
  } finally {
  fetchingRef.current = false;
  setLoadingMore(false);
}
}, []);

const handleMobileSuggestionFollow = async (
  userId
) => {
  if (suggestionFollowLoadingId) return;

  try {
    setSuggestionFollowLoadingId(userId);

    const { data } = await api.post(
      `/users/follow/${userId}`
    );

    const requestSent =
      data.message
        ?.toLowerCase()
        .includes("request") || false;

    window.dispatchEvent(
      new CustomEvent("chitchat-follow-change", {
        detail: {
          userId: String(userId),
          isFollowing: !requestSent,
          isRequested: requestSent,
        },
      })
    );

    if (requestSent) {
  // Private account:
  // Keep card and show Requested
  setMobileSuggestions((prev) =>
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
  // Public account:
  // Follow completed, remove from suggestions
  setMobileSuggestions((prev) =>
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
    setSuggestionFollowLoadingId(null);
  }
};

const handleMobileSuggestionDismiss = async (
  userId
) => {
  const dismissedIndex =
    mobileSuggestions.findIndex(
      (user) => user._id === userId
    );

  if (dismissedIndex === -1) return;

  // Remember every user dismissed during this session
  dismissedSuggestionIdsRef.current.add(
    String(userId)
  );

  // Exclude:
  // 1. All previously dismissed users
  // 2. All users currently visible
  const excludeIds = [
    ...dismissedSuggestionIdsRef.current,
    ...mobileSuggestions.map(
      (user) => String(user._id)
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

    setMobileSuggestions((prev) => {
      const updated = [...prev];

      if (replacementUser) {
        // Replace at exactly same position
        updated[dismissedIndex] =
          replacementUser;
      } else {
        // Actually no eligible users left
        updated.splice(dismissedIndex, 1);
      }

      return updated;
    });
  } catch (error) {
    console.error(
      "Failed to load replacement suggestion:",
      error
    );

    setMobileSuggestions((prev) =>
      prev.filter(
        (user) => user._id !== userId
      )
    );
  }
};

const handlePostCreated = async () => {
  // Reset feed to first page
  setPage(1);
  setHasMore(true);

  // Reload latest feed immediately
  await getFeed(1);

  // Scroll to top so new post is visible
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
  // ---------------------------------------
  // LOAD FIRST PAGE
  // ---------------------------------------
  useEffect(() => {
    getFeed(1);
  }, [getFeed]);

  // ---------------------------------------
  // INFINITE SCROLL
  // ---------------------------------------
  useEffect(() => {
    const target = observerRef.current;

    if (
  !target ||
  loadingMore ||
  !hasMore ||
  !navigator.onLine
) {
  return;
}

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (
          firstEntry.isIntersecting &&
          !fetchingRef.current
        ) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      {
        root: null,

        // Start loading before user reaches exact bottom
        rootMargin: "300px",

        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [ loadingMore, hasMore]);

  // ---------------------------------------
  // LOAD NEXT PAGE
  // ---------------------------------------
  useEffect(() => {
    if (page === 1) return;

    getFeed(page);
  }, [page, getFeed]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5 space-y-5 text-gray-900 dark:text-white">

       <CreatePost onPostCreated={handlePostCreated} />

        {posts.length === 0 ? (
  <p className="text-center text-gray-500 dark:text-gray-400">
    No posts yet.
  </p>
) : (
          <>
            {/* POSTS */}
            {posts.map((post, index) => (
  <div key={post._id}>
    <PostCard
      post={post}
      priority={index === 0}
    />

    {/* MOBILE SUGGESTED USERS - AFTER 2ND POST */}
    {index === 1 &&
      mobileSuggestions.length > 0 && (
        <div className="md:hidden mt-5 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800 py-4">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Suggested for you
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {mobileSuggestions.map(
              (suggestedUser) => (
                <div
                  key={suggestedUser._id}
                  className="relative min-w-[170px] w-[170px] border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center bg-white dark:bg-gray-900"
                >
                  {/* DISMISS */}
                  <button
                    type="button"
                    onClick={() =>
                      handleMobileSuggestionDismiss(
                        suggestedUser._id
                      )
                    }
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={`Dismiss ${suggestedUser.name}`}
                  >
                    <FaTimes size={15} />
                  </button>

                  {/* PROFILE */}
                  <Link
                    to={`/profile/${suggestedUser.username}`}
                    className="flex flex-col items-center w-full"
                  >
                    <img
                      src={
                        suggestedUser.profilePic ||
                        "/default-profile-picture.png"
                      }
                      alt={suggestedUser.username}
                      className="w-20 h-20 rounded-full object-cover"
                    />

                  <h3 className="mt-3 font-semibold text-sm text-gray-900 dark:text-white text-center truncate w-full">
  {suggestedUser.name}
</h3>

<p className="text-xs text-gray-500 dark:text-gray-400 text-center truncate w-full">
  @{suggestedUser.username}
</p>

<div className="h-[20px] mt-1 w-full flex items-center justify-center">
  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center truncate w-full">
    {suggestedUser.followedBy?.length > 0 ? (
      <>
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
      </>
    ) : (
      "Suggested for you"
    )}
  </p>
</div>
                  </Link>

                  {/* FOLLOW */}
                  <button
                    type="button"
                   onClick={() => {
  if (!suggestedUser.isRequested) {
    handleMobileSuggestionFollow(
      suggestedUser._id
    );
  }
}}
                    disabled={
  suggestionFollowLoadingId ===
    suggestedUser._id ||
  suggestedUser.isRequested
}
                    className="mt-3 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {suggestionFollowLoadingId ===
suggestedUser._id
  ? "Following..."
  : suggestedUser.isRequested
  ? "Requested"
  : suggestedUser.followsYou
  ? "Follow Back"
  : "Follow"}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
  </div>
))}

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div
                ref={observerRef}
                className="h-10 flex items-center justify-center"
              >
                {loadingMore && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading more posts...
                  </p>
                )}
              </div>
            )}

            {/* End of Feed */}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                You're all caught up.
              </p>
            )}
          </>
        )}

      </div>
    </Layout>
  );
}

export default Home;

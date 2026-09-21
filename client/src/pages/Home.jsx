const HOME_FEED_CACHE_KEY = "chitchat_home_feed_cache";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Layout from "../components/layouts/Layout";
import CreatePost from "../components/post/CreatePost";
import PostCard from "../components/post/PostCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Home() {
  const [posts, setPosts] = useState([]);

  // First page loading
  const [loading, setLoading] = useState(true);

  // Next page loading
  const [loadingMore, setLoadingMore] = useState(false);

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

    if (pageNumber === 1) {
      setLoading(true);
    } else {
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
    setLoading(false);
    setLoadingMore(false);
  }
}, []);

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
  loading ||
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
  }, [loading, loadingMore, hasMore]);

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

        {/* FIRST LOAD */}
        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            Loading...
          </p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No posts yet.
          </p>
        ) : (
          <>
            {/* POSTS */}
            {posts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                priority={index === 0}
              />
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

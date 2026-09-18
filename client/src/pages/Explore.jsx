import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Layout from "../components/layouts/Layout";
import ExploreGrid from "../components/explore/ExploreGrid";
import SearchBar from "../components/search/SearchBar";
import UserCard from "../components/search/UserCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Explore() {
  // =========================
  // EXPLORE POSTS
  // =========================

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);
  const fetchingRef = useRef(false);

  // =========================
  // SEARCH USERS
  // =========================

  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [searchLoading, setSearchLoading] =
    useState(false);

  // =========================
  // GET EXPLORE POSTS
  // =========================

  const getExplorePosts = useCallback(
    async (pageNumber) => {
      if (fetchingRef.current) return;

      try {
        fetchingRef.current = true;

        if (pageNumber === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const { data } = await api.get(
          `/posts/explore?page=${pageNumber}&limit=12`
        );

        if (pageNumber === 1) {
          setPosts(data.posts);
        } else {
          setPosts((prevPosts) => {
            // Prevent duplicate posts
            const existingIds = new Set(
              prevPosts.map((post) => post._id)
            );

            const newPosts = data.posts.filter(
              (post) =>
                !existingIds.has(post._id)
            );

            return [
              ...prevPosts,
              ...newPosts,
            ];
          });
        }

        setHasMore(data.hasMore);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load explore posts"
        );
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // =========================
  // LOAD FIRST PAGE
  // =========================

  useEffect(() => {
    getExplorePosts(1);
  }, [getExplorePosts]);

  // =========================
  // INFINITE SCROLL OBSERVER
  // =========================

  useEffect(() => {
    const target = observerRef.current;

    // Don't load posts while searching users
    if (
      !target ||
      loading ||
      loadingMore ||
      !hasMore ||
      keyword.trim()
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
          setPage(
            (prevPage) => prevPage + 1
          );
        }
      },
      {
        root: null,

        // Start loading slightly before bottom
        rootMargin: "300px",

        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    loading,
    loadingMore,
    hasMore,
    keyword,
  ]);

  // =========================
  // LOAD NEXT PAGE
  // =========================

  useEffect(() => {
    if (page === 1) return;

    getExplorePosts(page);
  }, [page, getExplorePosts]);

  // =========================
  // SEARCH USERS
  // =========================

  const searchUsers = async () => {
    try {
      setSearchLoading(true);

      const { data } = await api.get(
        `/users/search?keyword=${encodeURIComponent(
          keyword
        )}`
      );

      setUsers(data.users);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to search users"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Search after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim()) {
        searchUsers();
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-5 text-gray-900 dark:text-white">

        {/* TITLE */}

        <h1 className="text-3xl font-bold mb-6">
          Explore
        </h1>

        {/* SEARCH */}

        <div className="max-w-2xl mb-8">
          <SearchBar
            keyword={keyword}
            setKeyword={setKeyword}
          />
        </div>

        {/* SEARCH RESULTS */}

        {keyword.trim() ? (
          <div className="max-w-2xl space-y-4">

            {searchLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Searching...
              </p>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No users found.
              </p>
            ) : (
              users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                />
              ))
            )}

          </div>
        ) : (
          <>
            {/* EXPLORE POSTS */}

            {loading ? (
              <p className="text-center text-gray-600 dark:text-gray-300">
                Loading...
              </p>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No posts found.
              </p>
            ) : (
              <>
                <ExploreGrid posts={posts} />

                {/* Infinite Scroll Trigger */}

                {hasMore && (
                  <div
                    ref={observerRef}
                    className="h-16 flex items-center justify-center"
                  >
                    {loadingMore && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading more posts...
                      </p>
                    )}
                  </div>
                )}

                {/* End of Explore */}

                {!hasMore && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                    You're all caught up.
                  </p>
                )}
              </>
            )}

          </>
        )}

      </div>
    </Layout>
  );
}

export default Explore;

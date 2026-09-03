import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import ExploreGrid from "../components/explore/ExploreGrid";
import SearchBar from "../components/search/SearchBar";
import UserCard from "../components/search/UserCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Explore() {
  // Explore Posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Users
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // =========================
  // GET EXPLORE POSTS
  // =========================

  const getExplorePosts = async () => {
    try {
      const { data } = await api.get("/posts/explore");
      setPosts(data.posts);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load explore posts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExplorePosts();
  }, []);

  // =========================
  // SEARCH USERS
  // =========================

  const searchUsers = async () => {
    try {
      setSearchLoading(true);

      const { data } = await api.get(
        `/users/search?keyword=${encodeURIComponent(keyword)}`
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

        {/* =========================
            TITLE
        ========================= */}

        <h1 className="text-3xl font-bold mb-6">
          Explore
        </h1>

        {/* =========================
            SEARCH
        ========================= */}

        <div className="max-w-2xl mb-8">
          <SearchBar
            keyword={keyword}
            setKeyword={setKeyword}
          />
        </div>

        {/* =========================
            SEARCH RESULTS
        ========================= */}

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
          /* =========================
              EXPLORE POSTS
          ========================= */

          <>
            {loading ? (
              <p className="text-center text-gray-600 dark:text-gray-300">
                Loading...
              </p>
            ) : (
              <ExploreGrid posts={posts} />
            )}
          </>
        )}

      </div>
    </Layout>
  );
}

export default Explore;

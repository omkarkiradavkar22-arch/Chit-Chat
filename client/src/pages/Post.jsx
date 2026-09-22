import { useEffect, useState } from "react";
import {
  useLocation,
  useParams,
} from "react-router-dom";

import Layout from "../components/layouts/Layout";
import PostCard from "../components/post/PostCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Post() {
  const { id } = useParams();
  const location = useLocation();

  const [post, setPost] = useState(null);
  const [morePosts, setMorePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // PROFILE SOURCE
  // =========================

  const profileSource =
    location.state?.source === "profile";

  const sourceType =
    location.state?.sourceType || null;

  const sourcePosts =
    location.state?.posts || [];

  // =========================
  // GET SELECTED POST
  // =========================

  const getPost = async () => {
    try {
      // =================================
      // PROFILE → USE ALREADY LOADED POST
      // =================================

      if (profileSource && sourcePosts.length > 0) {
        const selectedPost = sourcePosts.find(
          (item) => String(item._id) === String(id)
        );

        if (selectedPost) {
          setPost(selectedPost);
          return;
        }
      }

      // =================================
      // NORMAL / DIRECT LINK → API
      // =================================

      const { data } = await api.get(
        `/posts/${id}`
      );

      setPost(data.post);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load post"
      );
    }
  };

  // =========================
  // GET MORE POSTS
  // =========================

  const getMorePosts = async () => {
    // =================================
    // PROFILE POSTS / LIKED / SAVED
    // =================================

    if (profileSource && sourcePosts.length > 0) {
      const selectedIndex =
        sourcePosts.findIndex(
          (item) =>
            String(item._id) === String(id)
        );

      if (selectedIndex !== -1) {
        // Only posts AFTER selected post
        const remainingPosts =
          sourcePosts.slice(selectedIndex + 1);

        setMorePosts(remainingPosts);
      } else {
        setMorePosts([]);
      }

      return;
    }

    // =================================
    // DIRECT POST LINK → EXPLORE POSTS
    // =================================

    try {
      const { data } = await api.get(
        "/posts/explore"
      );

      const filteredPosts =
        (data.posts || []).filter(
          (item) =>
            String(item._id) !== String(id)
        );

      const shuffledPosts = [
        ...filteredPosts,
      ].sort(() => Math.random() - 0.5);

      setMorePosts(shuffledPosts);
    } catch (error) {
      console.log(
        "Explore posts error:",
        error
      );

      setMorePosts([]);
    }
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);

        await Promise.all([
          getPost(),
          getMorePosts(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [id]);

  // =========================
  // SECTION TITLE
  // =========================

  const getSectionTitle = () => {
    if (!profileSource) {
      return "More posts";
    }

    if (sourceType === "liked") {
      return "More liked posts";
    }

    if (sourceType === "saved") {
      return "More saved posts";
    }

    return "More posts from this profile";
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5">

        {loading ? (
          <p className="text-center text-gray-500">
            Loading...
          </p>
        ) : !post ? (
          <p className="text-center text-gray-500">
            Post not found
          </p>
        ) : (
          <>
            {/* =========================
                SELECTED POST
            ========================= */}

            <PostCard
              post={post}
              priority={true}
            />

            {/* =========================
                MORE POSTS
            ========================= */}

            {morePosts.length > 0 && (
              <div className="mt-8">

                <div className="flex items-center gap-3 mb-5">

                  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />

                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {getSectionTitle()}
                  </p>

                  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />

                </div>

                <div>
                  {morePosts.map((item) => (
                    <PostCard
                      key={item._id}
                      post={item}
                    />
                  ))}
                </div>

              </div>
            )}

          </>
        )}

      </div>
    </Layout>
  );
}

export default Post;

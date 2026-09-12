import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layouts/Layout";
import PostCard from "../components/post/PostCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Post() {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // GET SELECTED POST
  // =========================

  const getPost = async () => {
    try {
      const { data } = await api.get(`/posts/${id}`);

      setPost(data.post);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load post"
      );
    }
  };

  // =========================
  // GET OTHER EXPLORE POSTS
  // =========================

  const getExplorePosts = async () => {
    try {
      const { data } = await api.get("/posts/explore");

      // Remove selected post
      const filteredPosts = data.posts.filter(
        (item) => item._id !== id
      );

      // Randomize posts
      const shuffledPosts = [...filteredPosts].sort(
        () => Math.random() - 0.5
      );

      setExplorePosts(shuffledPosts);
    } catch (error) {
      console.log("Explore posts error:", error);
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
          getExplorePosts()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [id]);

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

            <PostCard post={post} />

            {/* =========================
                MORE POSTS
            ========================= */}

            {explorePosts.length > 0 && (
              <div className="mt-8">

                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />

                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    More posts
                  </p>

                  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
                </div>

                <div>
                  {explorePosts.map((item) => (
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

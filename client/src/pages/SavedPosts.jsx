import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import PostCard from "../components/post/PostCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function SavedPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSavedPosts = async () => {
    try {
      const { data } = await api.get("/posts/saved");

      setPosts(data.posts);

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to load saved posts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5">

        <h1 className="text-3xl font-bold mb-6">
          Saved Posts
        </h1>

        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500">
            No saved posts.
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
            />
          ))
        )}

      </div>
    </Layout>
  );
}

export default SavedPosts;
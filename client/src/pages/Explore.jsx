import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import ExploreGrid from "../components/explore/ExploreGrid";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-5 text-gray-900 dark:text-white">

        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Explore
        </h1>

        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            Loading...
          </p>
        ) : (
          <ExploreGrid posts={posts} />
        )}

      </div>
    </Layout>
  );
}

export default Explore;

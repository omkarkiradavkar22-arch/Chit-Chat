import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import CreatePost from "../components/post/CreatePost";
import PostCard from "../components/post/PostCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFeed = async () => {
    try {
      const { data } = await api.get("/posts/feed");

      setPosts(data.posts);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load feed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFeed();
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5 space-y-5">

        <CreatePost />

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500">
            No posts yet.
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

export default Home;
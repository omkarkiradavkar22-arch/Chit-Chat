import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/layouts/Layout";
import PostCard from "../components/post/PostCard";
import CommentSection from "../components/comments/CommentSection";
import api from "../services/api";
import { toast } from "react-hot-toast";

function PostComments() {
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const getPost = async () => {
    try {
      const { data } = await api.get(`/posts/${id}`);
      setPost(data.post);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load post"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPost();
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
            <PostCard post={post} />

            <CommentSection post={post} />
          </>
        )}
      </div>
    </Layout>
  );
}

export default PostComments;
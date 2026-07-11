import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Layout from "../components/layouts/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { username } = useParams();
  const { user, loadUser } = useAuth();

  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relationship, setRelationship] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
//const isMe = user?._id === profile._id;
const [likedPosts, setLikedPosts] = useState([]);
const [savedPosts, setSavedPosts] = useState([]);
  const getProfile = async () => {
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.user);
setRelationship(data.relationship);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, [username]);

  const loadLikedPosts = async () => {
  const { data } = await api.get("/posts/liked");
  setLikedPosts(data.posts);
};

const loadSavedPosts = async () => {
  const { data } = await api.get("/posts/saved");
  setSavedPosts(data.posts);
};
useEffect(() => {
  getProfile();

  if (user?.username === username) {
    loadLikedPosts();
    loadSavedPosts();
  }
}, [username]);

  const handleFollow = async () => {
  try {
    const { data } = await api.post(
      `/users/follow/${profile._id}`
    );

    toast.success(data.message);

    await getProfile();
    await loadUser();
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed"
    );
  }
};

const handleUnfollow = async () => {
  try {
    const { data } = await api.post(
      `/users/unfollow/${profile._id}`
    );

    toast.success(data.message);

    await getProfile();
    await loadUser();
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed"
    );
  }
};

const handleMessage = async () => {
  try {
    const { data } = await api.post(
      `/chat/${profile._id}`
    );

    navigate(`/chat/${data.chat._id}`);
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to start chat"
    );
  }
};

const handleCancelRequest = async () => {
  try {
    const { data } = await api.delete(
      `/users/cancel-request/${profile._id}`
    );

    toast.success(data.message);

    await getProfile();
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed"
    );
  }
};

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-10">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-10">
          User not found
        </div>
      </Layout>
    );
  }

  const isMe = user?._id === profile._id;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">

        {/* Cover */}
        <div className="h-64 bg-gray-200 rounded-2xl overflow-hidden">
          {profile.coverPic ? (
            <img
              src={profile.coverPic}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>

        {/* Profile */}
        <div className="relative px-6">

          <img
            src={
              profile.profilePic ||
              "https://placehold.co/200x200?text=User"
            }
            alt={profile.name}
            className="w-36 h-36 rounded-full border-4 border-white object-cover absolute -top-16"
          />

          <div className="pt-24 flex justify-between items-start">

            <div>

              <h1 className="text-3xl font-bold">
                {profile.name}
              </h1>

              <p className="text-gray-500">
                @{profile.username}
              </p>

              <p className="mt-3">
                {profile.bio || "No bio yet"}
              </p>

              <div className="flex gap-8 mt-5">

                <p>
                  <span className="font-bold">
                    {profile.posts?.length || 0}
                  </span>{" "}
                  Posts
                </p>

                <p>
                  <span className="font-bold">
                    {profile.followers?.length || 0}
                  </span>{" "}
                  Followers
                </p>

                <p>
                  <span className="font-bold">
                    {profile.following?.length || 0}
                  </span>{" "}
                  Following
                </p>

              </div>

            </div>

            {isMe ? (
              <Link
                to="/edit-profile"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Edit Profile
              </Link>
            ) : relationship?.isFollowing ? (
  <button
  onClick={handleUnfollow}
  className="bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg"
>
  Following
</button>
) : relationship?.isRequested ? (
  <button
  onClick={handleCancelRequest}
    className="bg-yellow-500 text-white px-6 py-2 rounded-lg"
  >
    Requested
  </button>
) : (
  <button
  onClick={handleFollow}
  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
>
  Follow
</button>
)}

          </div>
          {relationship?.isFollowing && (
  <button
    onClick={handleMessage}
    className="bg-green-600 text-white px-6 py-2 rounded-lg"
  >
    Message
  </button>
)}

        </div>

       <div className="flex gap-6 border-b mt-10 mb-6">

  <button
    onClick={() => setActiveTab("posts")}
    className={`pb-2 ${
      activeTab === "posts"
        ? "border-b-2 border-blue-600 font-semibold"
        : ""
    }`}
  >
    Posts ({profile.posts?.length || 0})
  </button>

  {isMe && (
    <>
      <button
        onClick={() => setActiveTab("liked")}
        className={`pb-2 ${
          activeTab === "liked"
            ? "border-b-2 border-blue-600 font-semibold"
            : ""
        }`}
      >
        Liked ({likedPosts.length})
      </button>

      <button
        onClick={() => setActiveTab("saved")}
        className={`pb-2 ${
          activeTab === "saved"
            ? "border-b-2 border-blue-600 font-semibold"
            : ""
        }`}
      >
        Saved ({savedPosts.length})
      </button>
    </>
  )}

</div>

        {/* Posts Grid */}

        <div className="grid grid-cols-3 gap-3 mt-10">

  {(activeTab === "posts"
    ? profile.posts
    : activeTab === "liked"
    ? likedPosts
    : savedPosts
  )?.length === 0 ? (

    <p className="col-span-3 text-center text-gray-500">
      No posts found.
    </p>

  ) : (

    (activeTab === "posts"
      ? profile.posts
      : activeTab === "liked"
      ? likedPosts
      : savedPosts
    ).map((post) => (
      <Link
        key={post._id}
        to={`/post/${post._id}`}
      >
        <img
          src={post.images?.[0]}
          alt=""
          className="aspect-square object-cover rounded-xl hover:opacity-80 transition"
        />
      </Link>
    ))

  )}

</div>

      </div>
    </Layout>
  );
}

export default Profile;
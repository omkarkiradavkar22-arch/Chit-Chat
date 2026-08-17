import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Layout from "../components/layouts/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FollowersModal from "../components/profile/FollowersModal";

function Profile() {
  const { username } = useParams();
  const { user, loadUser } = useAuth();
  const { theme } = useTheme();

  const darkMode = theme === "dark";

  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relationship, setRelationship] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");

  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // =========================
  // GET PROFILE
  // =========================
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

  // =========================
  // LIKED POSTS
  // =========================
  const loadLikedPosts = async () => {
    try {
      const { data } = await api.get("/posts/liked");
      setLikedPosts(data.posts);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load liked posts"
      );
    }
  };

  // =========================
  // SAVED POSTS
  // =========================
  const loadSavedPosts = async () => {
    try {
      const { data } = await api.get("/posts/saved");
      setSavedPosts(data.posts);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load saved posts"
      );
    }
  };

  // =========================
  // EFFECT
  // =========================
  useEffect(() => {
    getProfile();

    if (user?.username === username) {
      loadLikedPosts();
      loadSavedPosts();
    }
  }, [username, user]);

  // =========================
  // FOLLOW
  // =========================
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

  // =========================
  // UNFOLLOW
  // =========================
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

  // =========================
  // MESSAGE
  // =========================
  const handleMessage = async () => {
    try {
      const { data } = await api.post(
        `/chat/${profile._id}`
      );

      navigate(`/chat/${data.chat._id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to start chat"
      );
    }
  };

  // =========================
  // CANCEL REQUEST
  // =========================
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

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <Layout>
        <div
          className={`text-center py-10 ${
            darkMode
              ? "text-gray-300"
              : "text-gray-700"
          }`}
        >
          Loading...
        </div>
      </Layout>
    );
  }

  // =========================
  // NOT FOUND
  // =========================
  if (!profile) {
    return (
      <Layout>
        <div
          className={`text-center py-10 ${
            darkMode
              ? "text-gray-300"
              : "text-gray-700"
          }`}
        >
          User not found
        </div>
      </Layout>
    );
  }

  const isMe = user?._id === profile._id;

  // =========================
  // CURRENT POSTS
  // =========================
  const currentPosts =
    activeTab === "posts"
      ? profile.posts
      : activeTab === "liked"
      ? likedPosts
      : savedPosts;

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto px-0 sm:px-2">

        {/* =========================
            COVER
        ========================= */}
        <div
          className={`w-full h-40 sm:h-52 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden ${
            darkMode
              ? "bg-gray-800"
              : "bg-gray-200"
          }`}
        >
          {profile.coverPic ? (
            <img
              src={profile.coverPic}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full ${
                darkMode
                  ? "bg-gray-800"
                  : "bg-gray-300"
              }`}
            />
          )}
        </div>

        {/* =========================
            PROFILE INFO
        ========================= */}
        <div className="relative px-3 sm:px-5 md:px-6">

          {/* PROFILE IMAGE */}
          <img
            src={
              profile.profilePic ||
              "/default-profile-picture.png"
            }
            alt={profile.name}
            className="
              w-24 h-24
              sm:w-28 sm:h-28
              md:w-36 md:h-36
              rounded-full
              border-4
              border-white
              dark:border-gray-900
              object-cover
              absolute
              -top-12
              sm:-top-14
              md:-top-16
            "
          />

          {/* =========================
              INFO + BUTTON
          ========================= */}
          <div className="pt-16 sm:pt-20 md:pt-24">

            <div className="
              flex
              flex-col
              gap-5
              md:flex-row
              md:justify-between
              md:items-start
            ">

              {/* USER INFO */}
              <div className="min-w-0">

                <h1
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    break-words
                  "
                >
                  {profile.name}
                </h1>

                <p className="text-gray-500 dark:text-gray-400 break-words">
                  @{profile.username}
                </p>

                <p className="mt-3 break-words">
                  {profile.bio || "No bio yet"}
                </p>

                {/* =========================
                    STATS
                ========================= */}
                <div className="
                  flex
                  flex-wrap
                  gap-x-6
                  sm:gap-x-8
                  gap-y-3
                  mt-5
                ">

                  <div>
                    <span className="font-bold">
                      {profile.posts?.length || 0}
                    </span>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Posts
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setFollowersOpen(true)
                    }
                    className="cursor-pointer"
                  >
                    <span className="font-bold">
                      {profile.followers?.length || 0}
                    </span>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Followers
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setFollowingOpen(true)
                    }
                    className="cursor-pointer"
                  >
                    <span className="font-bold">
                      {profile.following?.length || 0}
                    </span>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Following
                    </p>
                  </div>

                </div>
              </div>

              {/* =========================
                  ACTION BUTTON
              ========================= */}
              <div className="
                w-full
                md:w-auto
                flex
                flex-col
                gap-2
              ">

                {isMe ? (
                  <Link
                    to="/edit-profile"
                    className="
                      w-full
                      md:w-auto
                      text-center
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      px-5
                      sm:px-6
                      py-2
                      rounded-lg
                      transition
                    "
                  >
                    Edit Profile
                  </Link>
                ) : relationship?.isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    className="
                      w-full
                      md:w-auto
                      bg-gray-300
                      dark:bg-gray-700
                      hover:bg-gray-400
                      dark:hover:bg-gray-600
                      px-5
                      sm:px-6
                      py-2
                      rounded-lg
                      transition
                    "
                  >
                    Following
                  </button>
                ) : relationship?.isRequested ? (
                  <button
                    onClick={handleCancelRequest}
                    className="
                      w-full
                      md:w-auto
                      bg-yellow-500
                      hover:bg-yellow-600
                      text-white
                      px-5
                      sm:px-6
                      py-2
                      rounded-lg
                      transition
                    "
                  >
                    Requested
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="
                      w-full
                      md:w-auto
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      px-5
                      sm:px-6
                      py-2
                      rounded-lg
                      transition
                    "
                  >
                    Follow
                  </button>
                )}

                {/* MESSAGE */}
                {!isMe &&
                  relationship?.isFollowing && (
                    <button
                      onClick={handleMessage}
                      className="
                        w-full
                        md:w-auto
                        bg-green-600
                        hover:bg-green-700
                        text-white
                        px-5
                        sm:px-6
                        py-2
                        rounded-lg
                        transition
                      "
                    >
                      Message
                    </button>
                  )}

              </div>
            </div>
          </div>
        </div>

        {/* =========================
            TABS
        ========================= */}
        <div
          className="
            flex
            gap-5
            sm:gap-6
            border-b
            mt-8
            sm:mt-10
            mb-5
            overflow-x-auto
            scrollbar-hide
          "
        >

          <button
            onClick={() => setActiveTab("posts")}
            className={`
              pb-2
              whitespace-nowrap
              ${
                activeTab === "posts"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : ""
              }
            `}
          >
            Posts ({profile.posts?.length || 0})
          </button>

          {isMe && (
            <>
              <button
                onClick={() => setActiveTab("liked")}
                className={`
                  pb-2
                  whitespace-nowrap
                  ${
                    activeTab === "liked"
                      ? "border-b-2 border-blue-600 font-semibold"
                      : ""
                  }
                `}
              >
                Liked ({likedPosts.length})
              </button>

              <button
                onClick={() => setActiveTab("saved")}
                className={`
                  pb-2
                  whitespace-nowrap
                  ${
                    activeTab === "saved"
                      ? "border-b-2 border-blue-600 font-semibold"
                      : ""
                  }
                `}
              >
                Saved ({savedPosts.length})
              </button>
            </>
          )}

        </div>

        {/* =========================
            POSTS GRID
        ========================= */}
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            gap-2
            sm:gap-3
            mt-5
          "
        >

          {currentPosts?.length === 0 ? (
            <p
              className="
                col-span-2
                sm:col-span-3
                text-center
                text-gray-500
                dark:text-gray-400
                py-10
              "
            >
              No posts found.
            </p>
          ) : (
            currentPosts?.map((post) => (
              <Link
                key={post._id}
                to={`/post/${post._id}`}
                className="min-w-0"
              >
                <img
                  src={post.images?.[0]}
                  alt=""
                  className="
                    w-full
                    aspect-square
                    object-cover
                    rounded-lg
                    sm:rounded-xl
                    hover:opacity-80
                    transition
                  "
                />
              </Link>
            ))
          )}

        </div>
      </div>

      {/* =========================
          FOLLOWERS
      ========================= */}
      <FollowersModal
        open={followersOpen}
        onClose={() =>
          setFollowersOpen(false)
        }
        title="Followers"
        users={profile.followers || []}
        currentUser={user}
        refreshProfile={getProfile}
      />

      {/* =========================
          FOLLOWING
      ========================= */}
      <FollowersModal
        open={followingOpen}
        onClose={() =>
          setFollowingOpen(false)
        }
        title="Following"
        users={profile.following || []}
        currentUser={user}
        refreshProfile={getProfile}
      />
    </Layout>
  );
}

export default Profile;
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaEllipsisV } from "react-icons/fa";

import { FaThumbtack } from "react-icons/fa";

import Layout from "../components/layouts/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FollowersModal from "../components/profile/FollowersModal";
import ChitChatIcon from "../components/icons/ChitChatIcon";

const PROFILE_CACHE_PREFIX = "chitchat_profile_cache_";
const LIKED_POSTS_CACHE_KEY = "chitchat_liked_posts_cache";
const SAVED_POSTS_CACHE_KEY = "chitchat_saved_posts_cache";

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

  const [profilePicPreviewOpen, setProfilePicPreviewOpen] =
  useState(false);

  const [profileShareOpen, setProfileShareOpen] =
  useState(false);

  // =========================
// PROFILE MORE MENU
// =========================

const [profileMenuOpen, setProfileMenuOpen] =
  useState(false);

const [blockedUsersOpen, setBlockedUsersOpen] =
  useState(false);

const [blockedUsers, setBlockedUsers] =
  useState([]);

const [blockedUsersLoading, setBlockedUsersLoading] =
  useState(false);

const [profileActionLoading, setProfileActionLoading] =
  useState(false);

  const [showProfileChatShare, setShowProfileChatShare] =
  useState(false);

const [profileShareChats, setProfileShareChats] =
  useState([]);

const [profileShareLoading, setProfileShareLoading] =
  useState(false);

const [
  selectedProfileShareChats,
  setSelectedProfileShareChats,
] = useState([]);

const [sendingProfile, setSendingProfile] =
  useState(false);

const profilePicPressTimerRef = useRef(null);
const profilePicLongPressRef = useRef(false);

const handleProfilePicPressStart = () => {
  // Long press is only for mobile/touch view
  if (window.innerWidth >= 768) return;

  profilePicLongPressRef.current = false;

  profilePicPressTimerRef.current = setTimeout(() => {
    profilePicLongPressRef.current = true;
    setProfilePicPreviewOpen(true);
  }, 500);
};

const handleProfilePicPressEnd = () => {
  if (profilePicPressTimerRef.current) {
    clearTimeout(profilePicPressTimerRef.current);
    profilePicPressTimerRef.current = null;
  }
};

const handleProfilePicClick = () => {
  // Desktop/laptop: normal click opens preview
  if (window.innerWidth >= 768) {
    setProfilePicPreviewOpen(true);
    return;
  }

  // Mobile normal tap should do nothing
  if (profilePicLongPressRef.current) {
    profilePicLongPressRef.current = false;
  }
};

const getProfileUrl = () => {
  return `${window.location.origin}/profile/${profile.username}`;
};

const getProfileShareUrl = () => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:5000";

  return `${backendUrl}/api/v1/users/share/${profile.username}`;
};

const handleShareProfile = () => {
  setProfileShareOpen(true);
};

const openProfileChatShare = async () => {
  try {
    setProfileShareLoading(true);

    const { data } = await api.get("/chat");

    setProfileShareChats(data.chats || []);
    setSelectedProfileShareChats([]);

    setProfileShareOpen(false);
    setShowProfileChatShare(true);
  } catch (error) {
    console.error(
      "LOAD PROFILE SHARE CHATS ERROR:",
      error
    );

    toast.error(
      error.response?.data?.message ||
        "Failed to load chats"
    );
  } finally {
    setProfileShareLoading(false);
  }
};

const toggleProfileShareChat = (chatId) => {
  setSelectedProfileShareChats((prev) =>
    prev.includes(chatId)
      ? prev.filter((id) => id !== chatId)
      : [...prev, chatId]
  );
};

const sendProfileToChats = async () => {
  if (selectedProfileShareChats.length === 0) {
    return toast.error("Select at least one chat");
  }

  try {
    setSendingProfile(true);

    await Promise.all(
      selectedProfileShareChats.map(
        async (chatId) => {
          const formData = new FormData();

          formData.append("text", "");

          formData.append(
            "sharedProfile",
            profile._id
          );

          await api.post(
            `/messages/${chatId}`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );
        }
      )
    );

    toast.success(
      `Profile sent to ${
        selectedProfileShareChats.length
      } ${
        selectedProfileShareChats.length === 1
          ? "chat"
          : "chats"
      }!`
    );

    setSelectedProfileShareChats([]);
    setShowProfileChatShare(false);
    setProfilePicPreviewOpen(false);
  } catch (error) {
    console.error(
      "SEND PROFILE ERROR:",
      error
    );

    toast.error(
      error.response?.data?.message ||
        "Failed to send profile"
    );
  } finally {
    setSendingProfile(false);
  }
};

const handleMoreApps = async () => {
  const profileUrl = getProfileShareUrl();

  try {
    if (navigator.share) {
      await navigator.share({
        title: profile.name,
        text: `Check out ${profile.name}'s profile on Chit-Chat`,
        url: profileUrl,
      });

      setProfileShareOpen(false);
      return;
    }

    await navigator.clipboard.writeText(
      getProfileUrl()
    );

    toast.success("Profile link copied");
    setProfileShareOpen(false);
  } catch (error) {
    if (error?.name !== "AbortError") {
      toast.error("Failed to share profile");
    }
  }
};

const handleCopyProfileLink = async () => {
  try {
    await navigator.clipboard.writeText(
      getProfileUrl()
    );

    toast.success("Profile link copied");
    setProfileShareOpen(false);
  } catch (error) {
    toast.error("Failed to copy profile link");
  }
};

// =========================
// LOAD BLOCKED USERS
// =========================

const loadBlockedUsers = async () => {
  if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to view blocked users."
    );
    return;
  }

  try {
    setBlockedUsersLoading(true);

    const { data } = await api.get(
      "/users/blocked/list"
    );

    setBlockedUsers(data.users || []);
    setProfileMenuOpen(false);
    setBlockedUsersOpen(true);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to load blocked users"
    );
  } finally {
    setBlockedUsersLoading(false);
  }
};


// =========================
// BLOCK USER
// =========================

const handleBlockUser = async () => {
  if (profileActionLoading) return;

  if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to block this user."
    );
    return;
  }

  try {
    setProfileActionLoading(true);

    const { data } = await api.post(
      `/users/block/${profile._id}`
    );

    toast.success(data.message);

    setProfileMenuOpen(false);

    await getProfile();
    await loadUser();
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to block user"
    );
  } finally {
    setProfileActionLoading(false);
  }
};


// =========================
// UNBLOCK USER
// =========================

const handleUnblockUser = async (userId) => {
  if (profileActionLoading) return;

  if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to unblock this user."
    );
    return;
  }

  try {
    setProfileActionLoading(true);

    const { data } = await api.post(
      `/users/unblock/${userId}`
    );

    toast.success(data.message);

    setBlockedUsers((prev) =>
      prev.filter(
        (blockedUser) =>
          String(blockedUser._id) !== String(userId)
      )
    );

    await loadUser();
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to unblock user"
    );
  } finally {
    setProfileActionLoading(false);
  }
};


// =========================
// REMOVE FOLLOWER
// =========================

const handleRemoveFollower = async () => {
  if (profileActionLoading) return;

  if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to remove this follower."
    );
    return;
  }

  try {
    setProfileActionLoading(true);

    const { data } = await api.delete(
      `/users/remove-follower/${profile._id}`
    );

    toast.success(data.message);

    setProfileMenuOpen(false);

    await getProfile();
    await loadUser();
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to remove follower"
    );
  } finally {
    setProfileActionLoading(false);
  }
};


// =========================
// REMOVE FRIEND
// =========================

const handleRemoveFriend = async () => {
  if (profileActionLoading) return;

  if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to remove this friend."
    );
    return;
  }

  try {
    setProfileActionLoading(true);

    const { data } = await api.delete(
      `/users/remove-friend/${profile._id}`
    );

    toast.success(data.message);

    setProfileMenuOpen(false);

    await getProfile();
    await loadUser();
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to remove friend"
    );
  } finally {
    setProfileActionLoading(false);
  }
};

  // =========================
  // GET PROFILE
  // =========================
  const getProfile = async () => {
  const cacheKey =
    `${PROFILE_CACHE_PREFIX}${username}`;

  try {
    setLoading(true);

    // =========================
    // OFFLINE → LOAD CACHE
    // =========================

    if (!navigator.onLine) {
      const cachedData =
        localStorage.getItem(cacheKey);

      if (cachedData) {
        try {
          const parsedData =
            JSON.parse(cachedData);

          setProfile(parsedData.profile || null);
          setRelationship(
            parsedData.relationship || null
          );
        } catch (error) {
          console.error(
            "Profile cache parse error:",
            error
          );

          setProfile(null);
          setRelationship(null);
        }
      } else {
        setProfile(null);
        setRelationship(null);
      }

      return;
    }

    // =========================
    // ONLINE → API
    // =========================

    const { data } = await api.get(
      `/users/${username}`
    );

    setProfile(data.user);
    setRelationship(data.relationship);

    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        profile: data.user,
        relationship: data.relationship,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    // =========================
// BLOCKED PROFILE → NEVER USE CACHE
// =========================

if (
  error.response?.status === 403 &&
  error.response?.data?.blocked
) {
  localStorage.removeItem(cacheKey);

  setProfile(null);
  setRelationship(null);

  toast.error("Profile unavailable");

  return;
}

    // =========================
    // NETWORK ERROR → CACHE
    // =========================

    const cachedData =
      localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsedData =
          JSON.parse(cachedData);

        setProfile(parsedData.profile || null);
        setRelationship(
          parsedData.relationship || null
        );

        return;
      } catch (cacheError) {
        console.error(
          "Profile cache parse error:",
          cacheError
        );
      }
    }

    if (navigator.onLine) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load profile"
      );
    }
  } finally {
    setLoading(false);
  }
};

  // =========================
  // LIKED POSTS
  // =========================
  const loadLikedPosts = async () => {
  try {
    // OFFLINE → CACHE
    if (!navigator.onLine) {
      const cachedData =
        localStorage.getItem(
          LIKED_POSTS_CACHE_KEY
        );

      if (cachedData) {
        try {
          const parsedData =
            JSON.parse(cachedData);

          setLikedPosts(
            parsedData.posts || []
          );
        } catch (error) {
          console.error(
            "Liked posts cache parse error:",
            error
          );

          setLikedPosts([]);
        }
      } else {
        setLikedPosts([]);
      }

      return;
    }

    // ONLINE → API
    const { data } = await api.get(
      "/posts/liked"
    );

    const posts = data.posts || [];

    setLikedPosts(posts);

    localStorage.setItem(
      LIKED_POSTS_CACHE_KEY,
      JSON.stringify({
        posts,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "Load liked posts error:",
      error
    );

    const cachedData =
      localStorage.getItem(
        LIKED_POSTS_CACHE_KEY
      );

    if (cachedData) {
      try {
        const parsedData =
          JSON.parse(cachedData);

        setLikedPosts(
          parsedData.posts || []
        );

        return;
      } catch (cacheError) {
        console.error(
          "Liked posts cache parse error:",
          cacheError
        );
      }
    }

    if (navigator.onLine) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load liked posts"
      );
    }
  }
};

  // =========================
  // SAVED POSTS
  // =========================
  const loadSavedPosts = async () => {
  try {
    // OFFLINE → CACHE
    if (!navigator.onLine) {
      const cachedData =
        localStorage.getItem(
          SAVED_POSTS_CACHE_KEY
        );

      if (cachedData) {
        try {
          const parsedData =
            JSON.parse(cachedData);

          setSavedPosts(
            parsedData.posts || []
          );
        } catch (error) {
          console.error(
            "Saved posts cache parse error:",
            error
          );

          setSavedPosts([]);
        }
      } else {
        setSavedPosts([]);
      }

      return;
    }

    // ONLINE → API
    const { data } = await api.get(
      "/posts/saved"
    );

    const posts = data.posts || [];

    setSavedPosts(posts);

    localStorage.setItem(
      SAVED_POSTS_CACHE_KEY,
      JSON.stringify({
        posts,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "Load saved posts error:",
      error
    );

    const cachedData =
      localStorage.getItem(
        SAVED_POSTS_CACHE_KEY
      );

    if (cachedData) {
      try {
        const parsedData =
          JSON.parse(cachedData);

        setSavedPosts(
          parsedData.posts || []
        );

        return;
      } catch (cacheError) {
        console.error(
          "Saved posts cache parse error:",
          cacheError
        );
      }
    }

    if (navigator.onLine) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load saved posts"
      );
    }
  }
};

  // =========================
  // EFFECT
  // =========================
 useEffect(() => {
  getProfile();

  if (user) {
    loadLikedPosts();
    loadSavedPosts();
  }
}, [username, user?._id]);


useEffect(() => {
  const handlePostPinChange = () => {
    getProfile();
  };

  window.addEventListener(
    "chitchat-post-pin-change",
    handlePostPinChange
  );

  return () => {
    window.removeEventListener(
      "chitchat-post-pin-change",
      handlePostPinChange
    );
  };
}, [username]);



  // =========================
  // FOLLOW
  // =========================
  
  const handleFollow = async () => {
    if (!navigator.onLine) {
  toast.error(
    "You're offline. Connect to the internet to follow this user."
  );
  return;
}
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
    if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to unfollow this user."
    );
    return;
  }
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
    if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to start this chat."
    );
    return;
  }
    try {
      const { data } = await api.post(
        `/chat/${profile._id}`
      );

      navigate(`/chat/${data.chat._id}`, {
  state: {
    otherUser: {
      _id: profile._id,
      name: profile.name,
      username: profile.username,
      profilePic: profile.profilePic,
      lastSeen: profile.lastSeen,
    },
  },
});
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
    if (!navigator.onLine) {
    toast.error(
      "You're offline. Connect to the internet to cancel this request."
    );
    return;
  }
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

  console.log("PROFILE RELATIONSHIP DEBUG:", {
  currentUser: user?._id,
  profileUser: profile?._id,
  relationship,
});

  // =========================
  // CURRENT POSTS
  // =========================
  const currentPosts =
    activeTab === "posts"
      ? profile.posts
      : activeTab === "liked"
      ? likedPosts
      : savedPosts;


      const sortedCurrentPosts =
  activeTab === "posts"
    ? [...(currentPosts || [])].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (a.isPinned && b.isPinned) {
          return (
            new Date(b.pinnedAt || 0) -
            new Date(a.pinnedAt || 0)
          );
        }

        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      })
    : currentPosts || [];

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto px-0 sm:px-2">

        {/* ========================= */}
{/* PROFILE MORE MENU */}
{/* ========================= */}

<div className="relative">
  <button
    type="button"
    onClick={() =>
      setProfileMenuOpen((prev) => !prev)
    }
className={`ml-auto w-10 h-10 rounded-full flex items-center justify-center text-2xl transition ${      darkMode
        ? "hover:bg-gray-800 text-white"
        : "hover:bg-gray-100 text-gray-900"
    }`}
    aria-label="More profile options"
  >
    <FaEllipsisV size={18} />
  </button>

  {profileMenuOpen && (
    <>
      {/* CLICK OUTSIDE */}
      <button
        type="button"
        aria-label="Close profile menu"
        className="fixed inset-0 z-40 cursor-default"
        onClick={() =>
          setProfileMenuOpen(false)
        }
      />

      <div
        className={`absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border shadow-xl ${
          darkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* SHARE */}
        <button
          type="button"
          onClick={() => {
            setProfileMenuOpen(false);
            handleShareProfile();
          }}
          className={`w-full px-4 py-3 text-left text-sm transition ${
            darkMode
              ? "text-white hover:bg-gray-800"
              : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          Share this profile
        </button>

        {/* COPY LINK */}
        <button
          type="button"
          onClick={() => {
            setProfileMenuOpen(false);
            handleCopyProfileLink();
          }}
          className={`w-full px-4 py-3 text-left text-sm transition ${
            darkMode
              ? "text-white hover:bg-gray-800"
              : "text-gray-900 hover:bg-gray-100"
          }`}
        >
          Copy profile link
        </button>

        {/* OWN PROFILE */}
        {isMe && (
          <button
            type="button"
            onClick={loadBlockedUsers}
            disabled={blockedUsersLoading}
            className={`w-full px-4 py-3 text-left text-sm transition disabled:opacity-50 ${
              darkMode
                ? "text-white hover:bg-gray-800"
                : "text-gray-900 hover:bg-gray-100"
            }`}
          >
            {blockedUsersLoading
              ? "Loading..."
              : "Blocked users"}
          </button>
        )}

        {/* OTHER USER PROFILE */}
        {!isMe && (
          <>
            {/* REMOVE FOLLOWER */}
            {relationship?.isFollowing && (
              <button
                type="button"
                onClick={handleRemoveFollower}
                disabled={profileActionLoading}
                className={`w-full px-4 py-3 text-left text-sm transition disabled:opacity-50 ${
                  darkMode
                    ? "text-white hover:bg-gray-800"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                Remove follower
              </button>
            )}

            {/* REMOVE FRIEND */}
            {relationship?.isFollowing &&
              relationship?.followsMe && (
                <button
                  type="button"
                  onClick={handleRemoveFriend}
                  disabled={profileActionLoading}
                  className={`w-full px-4 py-3 text-left text-sm transition disabled:opacity-50 ${
                    darkMode
                      ? "text-white hover:bg-gray-800"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Remove friend
                </button>
              )}

            {/* BLOCK */}
            {/* BLOCK / UNBLOCK */}
{relationship?.iBlockedThem ? (
  <button
    type="button"
    onClick={async () => {
      await handleUnblockUser(profile._id);
      setProfileMenuOpen(false);
      await getProfile();
    }}
    disabled={profileActionLoading}
    className={`w-full px-4 py-3 text-left text-sm font-medium transition disabled:opacity-50 ${
      darkMode
        ? "text-green-400 hover:bg-gray-800"
        : "text-green-600 hover:bg-gray-100"
    }`}
  >
    {profileActionLoading
      ? "Please wait..."
      : "Unblock user"}
  </button>
) : (
  <button
    type="button"
    onClick={handleBlockUser}
    disabled={profileActionLoading}
    className={`w-full px-4 py-3 text-left text-sm font-medium transition disabled:opacity-50 ${
      darkMode
        ? "text-red-400 hover:bg-gray-800"
        : "text-red-600 hover:bg-gray-100"
    }`}
  >
    {profileActionLoading
      ? "Please wait..."
      : "Block user"}
  </button>
)}
          </>
        )}
      </div>
    </>
  )}
</div>

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
  onClick={handleProfilePicClick}
  onTouchStart={handleProfilePicPressStart}
  onTouchEnd={handleProfilePicPressEnd}
  onTouchCancel={handleProfilePicPressEnd}
  onContextMenu={(e) => e.preventDefault()}
  draggable={false}
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
    cursor-pointer
    select-none
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

                {relationship?.iBlockedThem ? null : isMe ? (
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
<div className="w-full grid grid-cols-3 gap-[2px] mt-5">

  {sortedCurrentPosts.length === 0 ? (
    <p
      className="
        col-span-3
        text-center
        text-gray-500
        dark:text-gray-400
        py-10
      "
    >
      No posts found.
    </p>
  ) : (
    sortedCurrentPosts.map((post) => (
      <Link
        key={post._id}
        to={`/post/${post._id}`}
        state={{
          source: "profile",
          sourceType: activeTab,
          posts: sortedCurrentPosts,
        }}
        className="
          relative
          block
          w-full
          aspect-[3/4]
          overflow-hidden
          bg-gray-200
          dark:bg-gray-800
        "
      >
        <img
          src={
            post.images?.[0] ||
            "https://placehold.co/400x400"
          }
          alt="Post"
          className="
            w-full
            h-full
            object-cover
            block
          "
        />

        {activeTab === "posts" && post.isPinned && (
          <div
            title="Pinned"
            className="
              absolute
              top-2
              right-2
              w-7
              h-7
              rounded-full
              bg-black/60
              text-white
              flex
              items-center
              justify-center
              text-sm
              shadow
            "
          >
            <FaThumbtack size={13} />
          </div>
        )}
      </Link>
    ))
  )}

</div>
      </div>


{/* ========================= */}
{/* BLOCKED USERS MODAL */}
{/* ========================= */}

{blockedUsersOpen && (
  <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center px-4">
    <div
      className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-900"
      }`}
    >
      {/* HEADER */}
      <div
        className={`flex items-center justify-between px-5 py-4 border-b ${
          darkMode
            ? "border-gray-700"
            : "border-gray-200"
        }`}
      >
        <h2 className="text-lg font-semibold">
          Blocked users
        </h2>

        <button
          type="button"
          onClick={() =>
            setBlockedUsersOpen(false)
          }
          className={`text-2xl leading-none ${
            darkMode
              ? "text-gray-300 hover:text-white"
              : "text-gray-500 hover:text-black"
          }`}
        >
          ×
        </button>
      </div>

      {/* BODY */}
      <div className="max-h-[60vh] overflow-y-auto">
        {blockedUsersLoading ? (
          <div className="py-10 text-center text-sm opacity-70">
            Loading...
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="py-10 text-center text-sm opacity-70">
            No blocked users
          </div>
        ) : (
          blockedUsers.map((blockedUser) => (
            <div
              key={blockedUser._id}
              className={`flex items-center gap-3 px-5 py-3 ${
                darkMode
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* PROFILE PICTURE */}
              <img
                src={
                  blockedUser.profilePic ||
                  "/default-profile-picture.png"
                }
                alt={blockedUser.name}
                className="w-11 h-11 rounded-full object-cover"
              />

              {/* USER INFO */}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {blockedUser.name}
                </p>

                <p className="text-sm opacity-60 truncate">
                  @{blockedUser.username}
                </p>
              </div>

              {/* UNBLOCK */}
              <button
                type="button"
                onClick={() =>
                  handleUnblockUser(
                    blockedUser._id
                  )
                }
                disabled={profileActionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                  darkMode
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

      {/* =========================
    PROFILE PICTURE PREVIEW
========================= */}
{profilePicPreviewOpen && (
  <div
    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-5"
    onClick={() =>
      setProfilePicPreviewOpen(false)
    }
  >
    <div
      className="flex flex-col items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={
          profile.profilePic ||
          "/default-profile-picture.png"
        }
        alt={profile.name}
        draggable={false}
        className="
          w-[280px] h-[280px]
          sm:w-[340px] sm:h-[340px]
          md:w-[420px] md:h-[420px]
          max-w-[85vw] max-h-[85vw]
          rounded-full
          object-cover
          shadow-2xl
          select-none
        "
      />

      <h2 className="mt-5 text-xl font-bold text-white">
        {profile.name}
      </h2>

      <p className="text-sm text-gray-300">
        @{profile.username}
      </p>

      <div className="flex items-center gap-8 mt-7">
  {/* SHARE PROFILE */}
  <button
    type="button"
    onClick={handleShareProfile}
    className="flex flex-col items-center gap-2 text-white"
  >
    <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    </div>

    <span className="text-xs">
      Share profile
    </span>
  </button>

  {/* COPY LINK */}
  <button
    type="button"
    onClick={handleCopyProfileLink}
    className="flex flex-col items-center gap-2 text-white"
  >
    <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
        <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15" />
      </svg>
    </div>

    <span className="text-xs">
      Copy link
    </span>
  </button>
</div>

    </div>
  </div>
)}


{/* =========================
    PROFILE SHARE SHEET
========================= */}
{profileShareOpen && (
  <div
    className="
      fixed inset-0 z-[300]
      bg-black/50
      flex items-end sm:items-center
      justify-center
      p-0 sm:p-4
    "
    onClick={() => setProfileShareOpen(false)}
  >
    <div
      className="
        w-full
        sm:max-w-sm
        bg-white
        dark:bg-gray-900
        rounded-t-2xl
        sm:rounded-2xl
        shadow-2xl
        overflow-hidden
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* HEADER */}
      <div
        className="
          px-5 py-4
          border-b
          border-gray-200
          dark:border-gray-800
        "
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Share profile
          </h3>

          <button
            type="button"
            onClick={() => setProfileShareOpen(false)}
            className="
              w-8 h-8
              rounded-full
              bg-gray-100
              dark:bg-gray-800
              flex items-center justify-center
              text-lg
            "
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <img
            src={
              profile.profilePic ||
              "/default-profile-picture.png"
            }
            alt={profile.name}
            className="
              w-12 h-12
              rounded-full
              object-cover
            "
          />

          <div className="min-w-0">
            <p className="font-semibold truncate">
              {profile.name}
            </p>

            <p className="text-sm text-gray-500 truncate">
              @{profile.username}
            </p>
          </div>
        </div>
      </div>

      {/* OPTIONS */}
      <div className="p-3">
        {/* SEND IN CHIT-CHAT */}
        <button
          type="button"
          onClick={openProfileChatShare}
          className="
            w-full
            flex items-center
            gap-4
            px-3 py-3
            rounded-xl
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
            text-left
          "
        >
          <div
  className="
    w-11 h-11
    rounded-full
    bg-blue-600
    text-white
    flex items-center justify-center
  "
>
  <ChitChatIcon
    size={24}
    className="text-white"
  />
</div>

          <div>
            <p className="font-medium">
              Send in Chit-Chat
            </p>

            <p className="text-xs text-gray-500">
              Share with your friends
            </p>
          </div>
        </button>

        {/* MORE APPS */}
        <button
          type="button"
          onClick={handleMoreApps}
          className="
            w-full
            flex items-center
            gap-4
            px-3 py-3
            rounded-xl
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
            text-left
          "
        >
          <div
            className="
              w-11 h-11
              rounded-full
              bg-gray-200
              dark:bg-gray-700
              flex items-center justify-center
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line
                x1="8.59"
                y1="13.51"
                x2="15.42"
                y2="17.49"
              />
              <line
                x1="15.41"
                y1="6.51"
                x2="8.59"
                y2="10.49"
              />
            </svg>
          </div>

          <div>
            <p className="font-medium">
              More apps
            </p>

            <p className="text-xs text-gray-500">
              Share outside Chit-Chat
            </p>
          </div>
        </button>

        {/* COPY LINK */}
        <button
          type="button"
          onClick={handleCopyProfileLink}
          className="
            w-full
            flex items-center
            gap-4
            px-3 py-3
            rounded-xl
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
            text-left
          "
        >
          <div
            className="
              w-11 h-11
              rounded-full
              bg-gray-200
              dark:bg-gray-700
              flex items-center justify-center
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
              <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15" />
            </svg>
          </div>

          <div>
            <p className="font-medium">
              Copy link
            </p>

            <p className="text-xs text-gray-500">
              Copy profile URL
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
)}


{/* =========================
    SEND PROFILE TO CHAT
========================= */}
{showProfileChatShare && (
  <div
    className="
      fixed inset-0 z-[310]
      bg-black/60
      flex items-center justify-center
    "
    onClick={() =>
      setShowProfileChatShare(false)
    }
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="
        bg-white dark:bg-gray-900
        w-[90%] max-w-md
        max-h-[70vh]
        rounded-2xl
        shadow-xl
        overflow-hidden
      "
    >
      {/* HEADER */}
      <div
        className="
          flex items-center justify-between
          p-4
          border-b
          border-gray-200
          dark:border-gray-700
        "
      >
        <h2 className="text-lg font-semibold">
          Send to
        </h2>

        <button
          type="button"
          onClick={() =>
            setShowProfileChatShare(false)
          }
          className="text-2xl text-gray-500"
        >
          ×
        </button>
      </div>

      {/* CHATS */}
      <div className="overflow-y-auto max-h-[55vh]">
        {profileShareLoading ? (
          <p className="text-center py-6 text-gray-500">
            Loading chats...
          </p>
        ) : profileShareChats.length === 0 ? (
          <p className="text-center py-6 text-gray-500">
            No chats found
          </p>
        ) : (
          profileShareChats.map((chat) => {
            const selected =
              selectedProfileShareChats.includes(
                chat._id
              );

            return (
              <button
                type="button"
                key={chat._id}
                onClick={() =>
                  toggleProfileShareChat(
                    chat._id
                  )
                }
                disabled={sendingProfile}
                className={`
                  w-full
                  flex items-center
                  gap-3
                  px-4 py-3
                  text-left
                  transition
                  ${
                    selected
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <img
                  src={
                    chat.otherUser?.profilePic ||
                    "/default-profile-picture.png"
                  }
                  alt={
                    chat.otherUser?.name || ""
                  }
                  className="
                    w-11 h-11
                    rounded-full
                    object-cover
                  "
                />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {chat.otherUser?.name}
                  </p>

                  <p className="text-sm text-gray-500 truncate">
                    @{chat.otherUser?.username}
                  </p>
                </div>

                <div
                  className={`
                    w-6 h-6
                    rounded-full
                    border-2
                    flex items-center
                    justify-center
                    ${
                      selected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-400 dark:border-gray-500"
                    }
                  `}
                >
                  {selected && (
                    <span className="text-sm font-bold">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* SEND BUTTON */}
      {profileShareChats.length > 0 && (
        <div
          className="
            p-4
            border-t
            border-gray-200
            dark:border-gray-700
          "
        >
          <button
            type="button"
            onClick={sendProfileToChats}
            disabled={
              selectedProfileShareChats.length ===
                0 || sendingProfile
            }
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              disabled:bg-gray-300
              dark:disabled:bg-gray-700
              disabled:cursor-not-allowed
              text-white
              font-semibold
              py-3
              rounded-xl
              transition
            "
          >
            {sendingProfile
              ? "Sending..."
              : selectedProfileShareChats.length >
                0
              ? `Send (${selectedProfileShareChats.length})`
              : "Send"}
          </button>
        </div>
      )}
    </div>
  </div>
)}

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

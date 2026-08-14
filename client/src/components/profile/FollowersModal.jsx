import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api"; 
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function FollowersModal({
  open,
  onClose,
  title,
  users,
  currentUser,
  refreshProfile,
}) {
    useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);


  const { loadUser } = useAuth();

const [usersList, setUsersList] = useState(users || []);

useEffect(() => {
  setUsersList(users || []);
}, [users]);

const patchUser = (userId, changes) => {
  setUsersList((prev) =>
    prev.map((u) => (u._id === userId ? { ...u, ...changes } : u))
  );
};

const handleFollowToggle = async (selectedUser) => {
  try {
    if (selectedUser.isFollowing) {
      // Currently following -> unfollow
      await api.post(`/users/unfollow/${selectedUser._id}`);
      patchUser(selectedUser._id, { isFollowing: false, isRequested: false });
    } else if (selectedUser.isRequested) {
      // Request already sent -> cancel it
      await api.delete(`/users/cancel-request/${selectedUser._id}`);
      patchUser(selectedUser._id, { isFollowing: false, isRequested: false });
    } else {
      // Not following, no request yet -> follow (or send request if private)
      const { data } = await api.post(`/users/follow/${selectedUser._id}`);

      if (data.message?.toLowerCase().includes("request")) {
        patchUser(selectedUser._id, { isRequested: true, isFollowing: false });
      } else {
        patchUser(selectedUser._id, { isFollowing: true, isRequested: false });
      }

      toast.success(data.message);
    }

    await loadUser();
    await refreshProfile();
  } catch (err) {
    toast.error(err.response?.data?.message || "Something went wrong");
  }
};

  const navigate = useNavigate();

  if (!open) return null;

  return (
   <div
  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  onClick={onClose}
>
     <div
  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden transition-colors"
  onClick={(e) => e.stopPropagation()}
>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">

          {users.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">
              No users found
            </p>
          ) : (
            
            usersList.map((user) => (
                <div
  key={user._id}
  className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
>
 <div
  onClick={() => {
    onClose();
    navigate(`/profile/${user.username}`);
  }}
  className="flex items-center gap-3 cursor-pointer"
>
  <img
    src={
      user.profilePic || "/default-profile-picture.png"
    }
    alt={user.name}
    className="w-12 h-12 rounded-full object-cover"
  />

  <div>
    <p className="font-semibold">
      {user.name}
    </p>

    <p className="text-gray-500 dark:text-gray-400 text-sm">
      @{user.username}
    </p>
  </div>
</div>
             {currentUser._id !== user._id && (
  <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    handleFollowToggle(user);
  }}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
      user.isFollowing
        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
        : user.isRequested
        ? "bg-yellow-500 text-white hover:bg-yellow-600"
        : "bg-blue-600 text-white hover:bg-blue-700"
    }`}
  >
    {user.isFollowing
      ? "Following"
      : user.isRequested
      ? "Requested"
      : "Follow"}
  </button>
)}


              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}

export default FollowersModal;
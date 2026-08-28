import { Link ,useNavigate} from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { FaHeart, FaRegComment, FaUserPlus, FaEnvelope, FaCheck, FaPhone, FaPhoneSlash } from "react-icons/fa";

function NotificationCard({ notification }) {

    const { theme } = useTheme();
  const darkMode = theme === "dark";

  const navigate = useNavigate();

  const [currentNotification, setCurrentNotification] =
    useState(notification);
  
  const [isFollowing, setIsFollowing] = useState(
    notification.isFollowing
  );

 const handleClick = () => {
  if (
    notification.type === "like" ||
    notification.type === "comment"
  ) {
    navigate(`/post/${notification.post._id}`);
    return;
  }

  if (
    notification.type === "follow" ||
    notification.type === "follow_request"
  ) {
    navigate(`/profile/${notification.sender.username}`);
    return;
  }

  // 📞 Call notifications
  if (
    notification.type === "incoming_call" ||
    notification.type === "missed_call"
  ) {
    if (notification.chat) {
      navigate(`/chat/${notification.chat}`);
    }
    return;
  }

  if (notification.type === "message" && notification.chat) {
    navigate(`/chat/${notification.chat}`);
  }
};


const handleAccept = async () => {
  try {
    await api.post(
      `/users/accept-request/${notification.sender._id}`
    );

    setCurrentNotification((prev) => ({
      ...prev,
      type: "follow_accept",
      status: "accepted",
    }));

    toast.success("Request accepted");
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Failed"
    );
  }
};

const handleReject = async () => {
  try {
    await api.post(
      `/users/reject-request/${notification.sender._id}`
    );

   setCurrentNotification((prev) => ({
  ...prev,
  status: "rejected",
}));

    toast.success("Request rejected");
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Failed"
    );
  }
};

const handleFollowBack = async () => {
  try {
    await api.post(
      `/users/follow/${notification.sender._id}`
    );

    setIsFollowing(true);

    toast.success("Following");
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Failed"
    );
  }
};

const getPriorityStyle = () => {
  switch (notification.priority) {
    case "urgent":
      return {
        label: "URGENT",
        className: darkMode
          ? "bg-red-900/40 text-red-400 border-red-700"
          : "bg-red-100 text-red-600 border-red-200",
      };

    case "important":
      return {
        label: "IMPORTANT",
        className: darkMode
          ? "bg-orange-900/40 text-orange-400 border-orange-700"
          : "bg-orange-100 text-orange-600 border-orange-200",
      };

    default:
      return {
        label: "NORMAL",
        className: darkMode
          ? "bg-gray-700 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-500 border-gray-200",
      };
  }
};

const priority = getPriorityStyle();

  const getMessage = () => {
switch (currentNotification.type) {
    case "like":
  return (
    <>
      liked your post <FaHeart className="inline text-red-500 ml-1" />
    </>
  );

   case "comment":
  return notification.comment
    ? `commented: "${notification.comment.text}"`
    : (
        <span className="inline-flex items-center gap-1">
          commented on your post
          <FaRegComment className="text-blue-500" />
        </span>
      );

case "follow":
  return (
    <span className="inline-flex items-center gap-1">
      started following you
      <FaUserPlus className="text-blue-500" />
    </span>
  );

case "follow_request":
  return (
    <span className="inline-flex items-center gap-1">
      sent you a follow request
      <FaEnvelope className="text-blue-500" />
    </span>
  );

case "follow_accept":
  return (
    <span className="inline-flex items-center gap-1">
      accepted your follow request
      <FaCheck className="text-green-500" />
    </span>
  );

case "incoming_call":
  return (
    <span className="inline-flex items-center gap-1">
      called you
      <FaPhone className="text-green-500" />
    </span>
  );

case "missed_call":
  return (
    <span className="inline-flex items-center gap-1">
      Missed call
      <FaPhoneSlash className="text-red-500" />
    </span>
  );

    case "message": {
      const preview = currentNotification.text
        ? `"${
            currentNotification.text.length > 60
              ? currentNotification.text.slice(0, 60) + "…"
              : currentNotification.text
          }"`
        : "sent you a message";

      const urgencyLabel =
        currentNotification.priority === "urgent"
          ? "an urgent"
          : "an important";

      return `sent you ${urgencyLabel} message: ${preview}`;
    }

    default:
      return "";
  }
};


  return (
    <div
  onClick={handleClick}
  className={`cursor-pointer rounded-xl shadow p-4 transition border ${
  darkMode
    ? "bg-[#111827] border-gray-700 text-white hover:bg-[#172235] hover:shadow-lg"
    : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:shadow-md"
} ${
  !notification.isRead
    ? "border-l-4 border-l-blue-500"
    : ""
}`}
>
      <div className="flex items-center gap-4">
        {!notification.isRead && (
    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
  )}
        <img
          src={
            notification.sender.profilePic || "/default-profile-picture.png"
          }
          alt=""
          className="w-12 h-12 rounded-full object-cover"
        />

        {notification.type === "message" &&
          (notification.priority === "urgent" ||
            notification.priority === "important") && (
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full border ${priority.className}`}
              >
                {priority.label}
              </span>
            </div>
          )}

        <div className="flex-1">

          <p>

            <Link
              to={`/profile/${notification.sender.username}`}
              className="font-semibold"
            >
              {notification.sender.name}
            </Link>{" "}

            {getMessage()}

          </p>

          <p className={`text-sm mt-1 ${
  darkMode ? "text-gray-400" : "text-gray-500"
}`}>
            {formatDistanceToNow(
  new Date(notification.createdAt),
  {
    addSuffix: true,
  }
)}
          </p>

        </div>

        {notification.post && (

          <img
            src={notification.post.images[0]}
            alt=""
            className="w-14 h-14 rounded-lg object-cover"
          />

        )}

        {currentNotification.type === "follow_request" &&
        currentNotification.status === "pending" && (
  <div className="flex gap-2 mt-3">

    <button
      onClick={(e) => {
        e.stopPropagation();
        handleAccept();
      }}
      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
    >
      Accept
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        handleReject();
      }}
      className={`px-3 py-1 rounded transition ${
  darkMode
    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
    : "bg-gray-300 text-gray-800 hover:bg-gray-400"
}`}
    >
      Reject
    </button>

  </div>
)}

{(currentNotification.type === "follow_accept" ||
 currentNotification.type === "follow") &&
!isFollowing && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleFollowBack();
    }}
    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
  >
    Follow Back
  </button>
)}

{(currentNotification.type === "follow_accept" ||
 currentNotification.type === "follow") &&
isFollowing && (
  <button
    disabled
    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
  >
    Following
  </button>
)}

      </div>
    </div>
  );
}

export default NotificationCard;

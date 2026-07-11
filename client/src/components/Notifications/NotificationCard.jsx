import { Link ,useNavigate} from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

function NotificationCard({ notification }) {
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
  }
};
  const getMessage = () => {
  switch (notification.type) {

    case "like":
      return "liked your post ❤️";

    case "comment":
      return notification.comment
        ? `commented: "${notification.comment.text}"`
        : "commented on your post 💬";

    case "follow":
      return "started following you 👤";

    case "follow_request":
      return "sent you a follow request 📩";

    default:
      return "";
  }
};

const navigate = useNavigate();

  return (
    <div
  onClick={handleClick}
  className={`cursor-pointer bg-white rounded-xl shadow p-4 hover:shadow-md hover:bg-gray-50 transition ${
    !notification.isRead
      ? "border-l-4 border-blue-500"
      : ""
  }`}
>
      <div className="flex items-center gap-4">
        {!notification.isRead && (
    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
  )}
        <img
          src={
            notification.sender.profilePic
          }
          alt=""
          className="w-12 h-12 rounded-full object-cover"
        />

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

          <p className="text-gray-500 text-sm mt-1">
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

      </div>
    </div>
  );
}

export default NotificationCard;
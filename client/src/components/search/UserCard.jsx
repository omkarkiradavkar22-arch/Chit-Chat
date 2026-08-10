import { Link } from "react-router-dom";

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl shadow p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
    >
      <img
        src={
          user.profilePic || "/default-profile-picture.png"
        }
        alt={user.name}
        className="w-14 h-14 rounded-full object-cover"
      />

      <div>
        <h2 className="font-semibold text-lg dark:text-white">
          {user.name}
        </h2>

        <p className="text-gray-500 dark:text-gray-400">
          @{user.username}
        </p>
      </div>
    </Link>
  );
}

export default UserCard;
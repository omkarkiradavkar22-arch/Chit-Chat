import { Link } from "react-router-dom";

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      className="flex items-center gap-4 bg-white rounded-xl shadow p-4 hover:bg-gray-50 transition"
    >
      <img
        src={
          user.profilePic ||
          "https://placehold.co/100x100?text=User"
        }
        alt={user.name}
        className="w-14 h-14 rounded-full object-cover"
      />

      <div>
        <h2 className="font-semibold text-lg">
          {user.name}
        </h2>

        <p className="text-gray-500">
          @{user.username}
        </p>
      </div>
    </Link>
  );
}

export default UserCard;
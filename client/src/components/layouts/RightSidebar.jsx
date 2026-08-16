import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function RightSidebar() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow dark:shadow-black/30 p-5 sticky top-20 border border-gray-200 dark:border-gray-800 transition-colors">

      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Suggested Users
      </h2>

      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <img
              src="https://placehold.co/50x50"
              alt="User"
              className="w-12 h-12 rounded-full"
            />

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Username
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                @username
              </p>
            </div>

          </div>

          <Link
            to="#"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Follow
          </Link>

        </div>

      </div>
    </div>
  );
}

export default RightSidebar;
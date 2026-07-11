import { Link } from "react-router-dom";

function RightSidebar() {
  return (
    <div className="bg-white rounded-xl shadow p-5 sticky top-20">
      <h2 className="text-xl font-bold mb-4">
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
              <h3 className="font-semibold">
                Username
              </h3>

              <p className="text-sm text-gray-500">
                @username
              </p>
            </div>
          </div>

          <Link
            to="#"
            className="text-blue-600 font-semibold hover:underline"
          >
            Follow
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RightSidebar;
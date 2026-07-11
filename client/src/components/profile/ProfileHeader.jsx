import { useAuth } from "../../context/AuthContext";

function ProfileHeader({ user }) {
  const { user: currentUser } = useAuth();

  const isOwner = currentUser?._id === user?._id;

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">

        <img
          src={
            user?.profilePicture ||
            "https://placehold.co/150x150"
          }
          alt="Profile"
          className="w-36 h-36 rounded-full object-cover"
        />

        <div className="flex-1">

          <h1 className="text-3xl font-bold">
            {user?.name}
          </h1>

          <p className="text-gray-500">
            @{user?.username}
          </p>

          <p className="mt-4">
            {user?.bio || "No bio yet."}
          </p>

          <div className="flex gap-8 mt-5">

            <div>
              <h2 className="font-bold text-xl">
                {user?.postsCount || 0}
              </h2>
              <p>Posts</p>
            </div>

            <div>
              <h2 className="font-bold text-xl">
                {user?.followers?.length || 0}
              </h2>
              <p>Followers</p>
            </div>

            <div>
              <h2 className="font-bold text-xl">
                {user?.following?.length || 0}
              </h2>
              <p>Following</p>
            </div>

          </div>

          <div className="mt-6">

            {isOwner ? (
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                Edit Profile
              </button>
            ) : (
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg">
                Follow
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default ProfileHeader;
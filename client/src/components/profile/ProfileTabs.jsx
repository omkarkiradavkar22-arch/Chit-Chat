function ProfileTabs() {
  return (
    <div className="bg-white rounded-xl shadow mb-6">
      <div className="flex justify-center">

        <button className="px-8 py-4 border-b-2 border-blue-600 font-semibold">
          Posts
        </button>

        <button className="px-8 py-4 text-gray-500">
          Saved
        </button>

        <button className="px-8 py-4 text-gray-500">
          Liked
        </button>

      </div>
    </div>
  );
}

export default ProfileTabs;
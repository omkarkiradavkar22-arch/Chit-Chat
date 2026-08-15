function ProfileTabs() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-6 transition-colors">
      <div className="flex justify-center">

        <button className="px-8 py-4 border-b-2 border-blue-600 font-semibold text-gray-900 dark:text-white">
          Posts
        </button>

        <button className="px-8 py-4 text-gray-500 dark:text-gray-400">
          Saved
        </button>

        <button className="px-8 py-4 text-gray-500 dark:text-gray-400">
          Liked
        </button>

      </div>
    </div>
  );
}

export default ProfileTabs;
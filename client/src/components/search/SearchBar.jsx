function SearchBar({ keyword, setKeyword }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
      <input
        type="text"
        placeholder="Search by name or username..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
      />
    </div>
  );
}

export default SearchBar;
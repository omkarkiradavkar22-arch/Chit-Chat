import { useEffect, useState } from "react";
import Layout from "../components/layouts/Layout";
import SearchBar from "../components/search/SearchBar";
import UserCard from "../components/search/UserCard";
import api from "../services/api";
import { toast } from "react-hot-toast";

function Search() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/users/search?keyword=${keyword}`
      );

      setUsers(data.users);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to search users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim()) {
        searchUsers();
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-5">

        <SearchBar
          keyword={keyword}
          setKeyword={setKeyword}
        />

        <div className="mt-6 space-y-4">

          {loading ? (
            <p className="text-center">
              Searching...
            </p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500">
              {keyword
                ? "No users found."
                : "Search users by name or username."}
            </p>
          ) : (
            users.map((user) => (
              <UserCard
                key={user._id}
                user={user}
              />
            ))
          )}

        </div>

      </div>
    </Layout>
  );
}

export default Search;
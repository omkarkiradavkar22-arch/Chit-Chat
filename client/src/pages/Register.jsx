import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { loadUser } = useAuth();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, username, email, password } = formData;

    if (!name || !username || !email || !password) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/register", formData);

      if (data.success) {
        // Load logged-in user
        await loadUser();

        toast.success("Account Created Successfully 🎉");

        navigate("/");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white px-4">
    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
      
      <h1 className="text-4xl font-bold text-center mb-2">
        ChitChat
      </h1>

      <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
        Create Account 
      </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-3
bg-white dark:bg-gray-700
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600
placeholder-gray-500 dark:placeholder-gray-400
focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full border rounded-lg p-3
bg-white dark:bg-gray-700
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600
placeholder-gray-500 dark:placeholder-gray-400
focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-lg p-3
bg-white dark:bg-gray-700
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600
placeholder-gray-500 dark:placeholder-gray-400
focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
           className="w-full border rounded-lg p-3
bg-white dark:bg-gray-700
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600
placeholder-gray-500 dark:placeholder-gray-400
focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6">
          Already have an account?
          <Link
            to="/login"
            className="text-blue-600 ml-2 font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
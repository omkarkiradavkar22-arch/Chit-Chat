import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function EditProfileModal({ user, onClose }) {
  const { loadUser } = useAuth();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    user?.profilePic || "https://placehold.co/150x150"
  );

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = new FormData();

      data.append("name", formData.name);
      data.append("username", formData.username);
      data.append("bio", formData.bio);

      if (image) {
        data.append("profilePic", image);
      }

      await api.put("/users/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadUser();

      toast.success("Profile Updated");

      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">

        <h2 className="text-2xl font-bold mb-5">
          Edit Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <img
                src={preview}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border"
              />

              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImage}
              />
            </label>
          </div>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <textarea
            rows={4}
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 resize-none"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-200"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default EditProfileModal;
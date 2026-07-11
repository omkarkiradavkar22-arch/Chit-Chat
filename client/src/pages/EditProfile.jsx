import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Layout from "../components/layouts/Layout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function EditProfile() {
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const [profilePic, setProfilePic] = useState(null);
const [coverPic, setCoverPic] = useState(null);
const [isPrivate, setIsPrivate] = useState(false);
const [profilePreview, setProfilePreview] = useState("");
const [coverPreview, setCoverPreview] = useState("");
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setProfilePreview(user.profilePic?.url || "");
setCoverPreview(user.coverPic?.url || "");
setIsPrivate(user.isPrivate);
    }
  }, [user]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);

    const formData = new FormData();

    formData.append("name", name);
    formData.append("username", username);
    formData.append("bio", bio);

    if (profilePic) {
      formData.append("profilePic", profilePic);
    }

    if (coverPic) {
      formData.append("coverPic", coverPic);
    }

    const { data } = await api.put(
      "/users/profile",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success(data.message);

    await loadUser();

    navigate(`/profile/${username}`);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to update profile"
    );
  } finally {
    setLoading(false);
  }
};

const handlePrivacy = async () => {
  try {
    const { data } = await api.patch("/users/privacy");

    setIsPrivate(data.isPrivate);

    await loadUser();

    toast.success(data.message);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      "Failed to update privacy"
    );
  }
};

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 mt-8">

        <h1 className="text-2xl font-bold mb-6">
          Edit Profile
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
  <label className="font-medium">
    Cover Photo
  </label>

  {coverPreview && (
    <img
      src={coverPreview}
      className="w-full h-40 object-cover rounded-xl my-2"
      alt=""
    />
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];

      if (!file) return;

      setCoverPic(file);
      setCoverPreview(URL.createObjectURL(file));
    }}
  />
</div>

<div>
  <label className="font-medium">
    Profile Picture
  </label>

  {profilePreview && (
    <img
      src={profilePreview}
      className="w-24 h-24 rounded-full object-cover my-2"
      alt=""
    />
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];

      if (!file) return;

      setProfilePic(file);
      setProfilePreview(URL.createObjectURL(file));
    }}
  />
</div>

          <div>
            <label className="font-medium">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full border rounded-lg p-3 mt-2"
            />
          </div>

          <div>
            <label className="font-medium">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="w-full border rounded-lg p-3 mt-2"
            />
          </div>

          <div>
            <label className="font-medium">
              Bio
            </label>

            <textarea
              rows={4}
              value={bio}
              onChange={(e) =>
                setBio(e.target.value)
              }
              className="w-full border rounded-lg p-3 mt-2"
            />
          </div>

          <div className="flex items-center justify-between border rounded-lg p-4">
  <div>
    <h3 className="font-semibold">
      Private Account
    </h3>

    <p className="text-sm text-gray-500">
      Only approved followers can see your profile.
    </p>
  </div>

  <button
    type="button"
    onClick={handlePrivacy}
    className={`px-5 py-2 rounded-lg text-white ${
      isPrivate
        ? "bg-red-500"
        : "bg-green-500"
    }`}
  >
    {isPrivate ? "Private" : "Public"}
  </button>
</div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading
              ? "Saving..."
              : "Save Changes"}
          </button>

        </form>
      </div>
    </Layout>
  );
}

export default EditProfile;
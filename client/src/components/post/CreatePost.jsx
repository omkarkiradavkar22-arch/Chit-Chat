import { useRef, useState } from "react";
import { FaImage } from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-hot-toast";

function CreatePost() {
  const fileInput = useRef(null);

  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);

    setImages(files);

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreview(urls);
  };

  const handleSubmit = async () => {
    if (!description.trim() && images.length === 0) {
      return toast.error("Please add description or image");
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("description", description);

      images.forEach((image) => {
        formData.append("images", image);
      });

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post created successfully");

      setDescription("");
      setImages([]);
      setPreview([]);

      if (fileInput.current) {
        fileInput.current.value = "";
      }

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create post"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <textarea
        placeholder="What's on your mind?"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full resize-none outline-none"
      />

      {preview.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {preview.map((img, index) => (
            <img
              key={index}
              src={img}
              alt="preview"
              className="rounded-xl h-48 w-full object-cover"
            />
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-5">
        <button
          type="button"
          onClick={() => fileInput.current.click()}
          className="flex items-center gap-2 text-blue-600"
        >
          <FaImage />
          Photos
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>

      <input
        ref={fileInput}
        hidden
        multiple
        type="file"
        accept="image/*"
        onChange={handleImages}
      />
    </div>
  );
}

export default CreatePost;
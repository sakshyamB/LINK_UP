import axios from "axios";
import { useState } from "react";

const CreatePost = ({ onCreated }) => {
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setuploadingImage] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      setPreview(uploadedUrl);
    } catch (error) {
      setError(error.message || "Failed to upload image.");
    }
    finally {
      setuploadingImage(false);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    setuploadingImage(true);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
    if (response.status !== 200) {
      throw new Error("Failed to upload image to Cloudinary.");
    }
    return response.data.secure_url;
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!preview) {
      setError("Please select an image to upload.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/post/create`,
        { caption, imageUrl: preview },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      onCreated?.(response.data.post);
      setCaption("");
      setPreview(null);
    } catch (error) {
        setError(error.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl shadow-md rounded-xl p-4 mb-4 mx-auto">
        <h2 className="font-semibold mb-3">Create a Post</h2>
        <input
          type="text"
          placeholder="Write a caption..."
          className="w-full border p-2 rounded mb-3"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border px-2 py-1 rounded"
          disabled={uploadingImage || loading}
        />
        {uploadingImage && <p className="text-sm text-slate-500 mt-2">Uploading image...</p>}
        {preview && <img src={preview} alt="preview" className="mt-3 max-h-56 rounded object-cover" />}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="bg-blue-500 mt-3 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Posting..." : "Post"}
        </button>
    </form>
  );
};

export default CreatePost;

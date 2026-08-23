import { useState } from "react";
import { api } from "../api";

const CreatePost = ({ onCreated }) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const next = e.target.files[0];
    setFile(next || null);
    if (next) setPreview(URL.createObjectURL(next));
    else setPreview(null);
  };

  const submit = async () => {
    if (!caption && !file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("caption", caption);
      if (file) form.append("image", file);
      const data = await api("/posts", { method: "POST", body: form });
      onCreated?.(data.post);
      setCaption("");
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-xl shadow-md rounded-xl p-4 mb-4 mx-auto">
      <h2 className="font-semibold mb-3">Create a Post</h2>
      <input
        type="text"
        placeholder="Write a caption..."
        className="w-full border p-2 rounded mb-3"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={handleFile} className="border px-2 py-1 rounded" />
      {preview && <img src={preview} alt="preview" className="mt-3 max-h-56 rounded object-cover" />}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-500 mt-3 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-60"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
};

export default CreatePost;

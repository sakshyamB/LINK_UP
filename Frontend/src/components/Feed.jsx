import { useEffect, useState } from "react";
import FeedCard from "./FeedCard";
import CreatePost from "./CreatePost";
import { api } from "../api";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api("/posts");
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex-1 px-2">
      <CreatePost onCreated={(post) => setPosts((prev) => [post, ...prev])} />
      {error && <p className="text-center text-red-500">{error}</p>}
      {posts.length === 0 && !error && (
        <p className="text-center text-gray-500 mt-8">No posts yet. Be the first to share something.</p>
      )}
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Feed;

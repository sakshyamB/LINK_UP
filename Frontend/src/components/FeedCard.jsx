import { useState } from "react";
import { MdMessage } from "react-icons/md";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const FeedCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(post.liked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [text, setText] = useState("");

  const handleLike = async () => {
    if (!user) return;
    const data = await api(`/posts/${post.id}/like`, { method: "POST" });
    setLiked(data.liked);
    setLikes(data.likes);
    onUpdate?.();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const data = await api(`/posts/${post.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setComments((prev) => [...prev, data.comment]);
    setText("");
    setShowComments(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${post.author?.id}`}>
          <img
            src={
              post.author?.avatar ||
              `https://ui-avatars.com/api/?name=${post.author?.username || "U"}`
            }
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>
        <div>
          <Link to={`/profile/${post.author?.id}`} className="font-semibold">
            {post.author?.username}
          </Link>
          <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
        </div>
      </div>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="post" className="w-full max-h-[500px] object-cover" />
      )}
      <div className="p-4">
        <div className="flex gap-4 mb-2">
          <button onClick={handleLike}>
            <FaHeart className={`cursor-pointer ${liked ? "text-red-500" : "text-gray-600"}`} />
          </button>
          <MdMessage
            className="cursor-pointer text-gray-600"
            onClick={() => setShowComments((v) => !v)}
          />
        </div>
        <p className="font-semibold">{likes} likes</p>
        {post.caption && (
          <p className="mt-1">
            <span className="font-semibold mr-2">{post.author?.username}</span>
            {post.caption}
          </p>
        )}
        <p
          className="text-sm text-gray-500 mt-2 cursor-pointer"
          onClick={() => setShowComments(!showComments)}
        >
          View all {comments.length} comments
        </p>
        {showComments && (
          <div className="mt-3 border-t pt-2">
            {comments.map((comment) => (
              <p key={comment.id} className="text-sm mb-1">
                <span className="font-semibold mr-2">{comment.user?.username}</span>
                {comment.text}
              </p>
            ))}
            {user && (
              <form onSubmit={submitComment} className="flex gap-2 mt-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button className="text-blue-600 text-sm font-medium">Post</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedCard;

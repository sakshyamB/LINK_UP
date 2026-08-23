import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api";
import { useSocket } from "../context/SocketContext";

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const { onlineIds } = useSocket() || { onlineIds: new Set() };
  const navigate = useNavigate();

  useEffect(() => {
    api("/friends").then((data) => setFriends(data.friends));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    api(`/users/search?q=${encodeURIComponent(query)}`).then((data) => setResults(data.users));
  }, [query]);

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white rounded-xl p-4 shadow-sm">
        <h1 className="text-xl font-bold mb-4">Friends & calls</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find people"
          className="w-full border rounded px-3 py-2 mb-4"
        />
        {results.map((user) => (
          <button
            key={user.id}
            onClick={() => navigate(`/profile/${user.id}`)}
            className="block w-full text-left py-2 border-b"
          >
            {user.username}
          </button>
        ))}
        <h2 className="font-semibold mt-4 mb-2">Your friends</h2>
        {friends.length === 0 && <p className="text-gray-500 text-sm">No friends yet.</p>}
        {friends.map((friend) => (
          <div key={friend.id} className="flex items-center justify-between py-2 border-b">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${onlineIds.has(friend.id) ? "bg-green-500" : "bg-gray-300"}`} />
              {friend.username}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/chat/${friend.id}`)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
              >
                Chat
              </button>
              <button
                onClick={() => navigate(`/call/${friend.id}`)}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded"
              >
                Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Friends;

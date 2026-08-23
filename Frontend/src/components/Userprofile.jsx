import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import FeedCard from "./FeedCard";

const Userprofile = () => {
  const { id } = useParams();
  const { user: me, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [userData, postData] = await Promise.all([
      api(`/users/${id}`),
      api(`/posts/user/${id}`),
    ]);
    setProfile(userData.user);
    setFriendship(userData.friendship);
    setBio(userData.user.bio || "");
    setPosts(postData.posts);
  };

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  if (!profile) return <p className="text-center mt-10">Loading profile...</p>;

  const isMe = me?.id === profile.id;

  const addFriend = async () => {
    const data = await api(`/friends/${profile.id}`, { method: "POST" });
    setFriendship(data.friendship);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.target);
    form.set("bio", bio);
    const data = await api("/users/me", { method: "PATCH", body: form });
    setUser(data.user);
    setProfile((prev) => ({ ...prev, ...data.user }));
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl overflow-hidden shadow-md">
        <div
          className="h-40 bg-gradient-to-r from-blue-500 to-cyan-500 bg-cover bg-center"
          style={{ backgroundImage: profile.coverPicture ? `url(${profile.coverPicture})` : undefined }}
        />
        <div className="px-6 pb-6">
          <img
            src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.username}&size=128`}
            alt=""
            className="w-24 h-24 rounded-full object-cover -mt-12 border-4 border-white"
          />
          <div className="flex justify-between items-start mt-2">
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              <p className="mt-2 text-gray-700">{profile.bio || "No bio yet."}</p>
              <p className="text-sm text-gray-500 mt-2">
                {profile.postsCount} posts · {profile.friendsCount} friends
              </p>
            </div>
            {!isMe && (
              <div className="flex gap-2">
                {friendship?.status === "ACCEPTED" ? (
                  <>
                    <Link to={`/chat/${profile.id}`} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                      Message
                    </Link>
                    <Link to={`/call/${profile.id}`} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">
                      Video call
                    </Link>
                  </>
                ) : friendship?.status === "PENDING" ? (
                  <span className="text-sm text-gray-500">Request pending</span>
                ) : (
                  <button onClick={addFriend} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                    Add friend
                  </button>
                )}
              </div>
            )}
          </div>
          {isMe && (
            <form onSubmit={saveProfile} className="mt-4 space-y-2 border-t pt-4">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                className="w-full border rounded p-2"
              />
              <label className="block text-sm">Avatar</label>
              <input type="file" name="avatar" accept="image/*" />
              <label className="block text-sm">Cover</label>
              <input type="file" name="cover" accept="image/*" />
              <button disabled={saving} className="bg-black text-white px-4 py-2 rounded">
                {saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="mt-6">
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default Userprofile;

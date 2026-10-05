import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import FeedCard from "./FeedCard";
import {
  FaCamera,
  FaUserPlus,
  FaUserCheck,
  FaUserClock,
  FaEnvelope,
  FaCog,
  FaTh,
  FaUserFriends,
  FaCalendarAlt,
  FaVenusMars,
  FaImage,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Profile = ({ currentUser }) => {
  const { id } = useParams();
  const signedInUser =
    currentUser || JSON.parse(localStorage.getItem("user") || "null");
  const targetUserId = id || signedInUser?.id;
  const isOwnProfile = targetUserId === signedInUser?.id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendStatus, setFriendStatus] = useState("NONE");
  const [friendshipId, setFriendshipId] = useState(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        };
        let profileId = targetUserId;

        if (!profileId) {
          const myProfile = await axios.get(`${API_URL}/profile/me`, config);
          profileId = myProfile.data.ProfileInfo?.id;
        }

        if (!profileId) {
          throw new Error("Could not determine the profile to load.");
        }

        const res = await axios.get(
          `${API_URL}/profile/${encodeURIComponent(profileId)}?page=1&limit=10`,
          config,
        );
        const data = res.data.profile;
        if (!data)
          throw new Error("The server returned an invalid profile response.");

        if (active) {
          setProfile(data);
          setPosts(data.posts || []);
          setFriends(data.friends || []);
          setFriendStatus(data.friendStatus || "NONE");
          setFriendshipId(data.friendshipId || null);
          setHasMore(data.pagination?.hasMore || false);
          setPage(1);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (active)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load profile.",
          );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      active = false;
    };
  }, [id, targetUserId]);

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await axios.get(
        `${API_URL}/profile/${encodeURIComponent(targetUserId)}?page=${nextPage}&limit=10`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      const data = res.data.profile;
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.pagination?.hasMore || false);
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts((existing) => existing.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((existing) =>
      existing.map((post) =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post,
      ),
    );
  };

  const handleFriendAction = async () => {
    if (friendActionLoading || !targetUserId) return;
    setFriendActionLoading(true);
    setError(null);
    const config = {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    };

    try {
      if (friendStatus === "NONE") {
        const response = await axios.post(
          `${API_URL}/friend/send/${encodeURIComponent(targetUserId)}`,
          {},
          config,
        );
        setFriendshipId(response.data.friendRequest?.id || null);
        setFriendStatus("PENDING_SENT");
      } else if (friendStatus === "PENDING_SENT") {
        if (!friendshipId)
          throw new Error("Friend request could not be identified.");
        await axios.delete(
          `${API_URL}/friend/cancel/${encodeURIComponent(friendshipId)}`,
          config,
        );
        setFriendshipId(null);
        setFriendStatus("NONE");
      } else if (friendStatus === "PENDING_RECEIVED") {
        if (!friendshipId)
          throw new Error("Friend request could not be identified.");
        await axios.post(
          `${API_URL}/friend/accept/${encodeURIComponent(friendshipId)}`,
          {},
          config,
        );
        setFriendStatus("FRIENDS");
      } else if (friendStatus === "FRIENDS") {
        if (!friendshipId)
          throw new Error("Friendship could not be identified.");
        await axios.delete(
          `${API_URL}/friend/unfriend/${encodeURIComponent(friendshipId)}`,
          config,
        );
        setFriendshipId(null);
        setFriendStatus("NONE");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Friend action failed.",
      );
    } finally {
      setFriendActionLoading(false);
    }
  };

  const renderFriendButton = () => {
    switch (friendStatus) {
      case "FRIENDS":
        return (
          <button
            onClick={handleFriendAction}
            disabled={friendActionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 text-sm font-bold rounded-xl transition"
          >
            <FaUserCheck className="text-emerald-500" />
            <span>Friends</span>
          </button>
        );
      case "PENDING_SENT":
        return (
          <button
            onClick={handleFriendAction}
            disabled={friendActionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-bold rounded-xl transition"
          >
            <FaUserClock />
            <span>Request Sent</span>
          </button>
        );
      case "PENDING_RECEIVED":
        return (
          <button
            onClick={handleFriendAction}
            disabled={friendActionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
          >
            <FaUserPlus />
            <span>Accept Request</span>
          </button>
        );
      case "NONE":
      default:
        return (
          <button
            onClick={handleFriendAction}
            disabled={friendActionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
          >
            <FaUserPlus />
            <span>Add Friend</span>
          </button>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500">
        <p className="text-lg font-semibold">{error || "User not found."}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full pb-10 select-none">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-5">
        <div className="h-48 sm:h-64 bg-slate-200 relative">
          {profile.coverPicture ? (
            <img
              src={profile.coverPicture}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          )}

          {isOwnProfile && (
            <button className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-2 backdrop-blur-sm transition">
              <FaCamera />
              <span>Edit Cover</span>
            </button>
          )}
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
            <div className="relative inline-block">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-indigo-600 ring-4 ring-white text-white font-bold flex items-center justify-center text-3xl sm:text-4xl shadow-md overflow-hidden bg-slate-100">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username?.charAt(0).toUpperCase()
                )}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 ring-2 ring-white shadow transition">
                  <FaCamera className="text-xs" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {isOwnProfile ? (
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
                >
                  <FaCog />
                  <span>Edit Profile</span>
                </Link>
              ) : (
                <>
                  {renderFriendButton()}

                  <Link
                    to={`/messages?user=${profile.id}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
                  >
                    <FaEnvelope />
                    <span>Message</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {profile.username}
            </h1>
            <p className="text-xs text-slate-400">@{profile.username}</p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 mt-3">
              {profile.gender && (
                <div className="flex items-center space-x-1.5 capitalize">
                  <FaVenusMars className="text-slate-400" />
                  <span>{profile.gender.toLowerCase()}</span>
                </div>
              )}
              {profile.dateofBirth && (
                <div className="flex items-center space-x-1.5">
                  <FaCalendarAlt className="text-slate-400" />
                  <span>
                    Born {new Date(profile.dateofBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center space-x-1.5">
                  <FaCalendarAlt className="text-slate-400" />
                  <span>
                    Joined{" "}
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-slate-100 text-sm">
              <div>
                <span className="font-bold text-slate-900">
                  {profile.postCount || 0}
                </span>{" "}
                <span className="text-slate-500">Posts</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">
                  {profile.friendCount || 0}
                </span>{" "}
                <span className="text-slate-500">Friends</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-t border-slate-100 px-4">
          {[
            { id: "posts", label: "Posts", icon: FaTh },
            { id: "friends", label: "Friends", icon: FaUserFriends },
            { id: "photos", label: "Photos", icon: FaImage },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="text-xs" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={{
                      ...post,
                      author: {
                        id: profile.id,
                        username: profile.username,
                        profilePicture: profile.profilePicture,
                      },
                      content: post.caption,
                      image: post.imageUrl,
                      likeCount: post._count?.likes || 0,
                      commentCount: post._count?.comments || 0,
                    }}
                    currentUser={signedInUser}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                ))}

                {hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={loadMorePosts}
                      disabled={loadingMore}
                      className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition disabled:opacity-50"
                    >
                      {loadingMore ? "Loading..." : "Load More Posts"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
                <FaTh className="text-3xl mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No posts published yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
            <h3 className="font-bold text-slate-800 text-base mb-4">
              Friends ({profile.friendCount || 0})
            </h3>
            {friends.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    to={`/profile/${friend.id}`}
                    className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                      {friend.profilePicture ? (
                        <img
                          src={friend.profilePicture}
                          alt={friend.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        friend.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {friend.username}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No friends to display.</p>
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
            <h3 className="font-bold text-slate-800 text-base mb-4">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {posts
                .filter((p) => p.imageUrl)
                .map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100"
                  >
                    <img
                      src={post.imageUrl}
                      alt="User media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

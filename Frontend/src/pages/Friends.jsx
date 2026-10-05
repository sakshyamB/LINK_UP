import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaCheck,
  FaComments,
  FaTimes,
  FaUserCircle,
  FaUserMinus,
} from "react-icons/fa";
import Leftbar from "../components/Leftbar";
import Navbar from "../components/Navbar";
import Rightbar from "../components/Rightbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

const Friends = () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const hasAuth = Boolean(currentUser?.id && localStorage.getItem("token"));
  const [friendships, setFriendships] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestPagination, setRequestPagination] = useState(null);
  const [requestsLoading, setRequestsLoading] = useState(hasAuth);
  const [requestsError, setRequestsError] = useState(
    hasAuth ? "" : "Sign in to view friend requests.",
  );
  const [activeTab, setActiveTab] = useState("friends");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [actingRequestId, setActingRequestId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.id || !localStorage.getItem("token")) {
      setError("Sign in to view your friends.");
      setLoading(false);
      return undefined;
    }

    let active = true;
    axios
      .get(
        `${API_URL}/friend/list/${encodeURIComponent(currentUser.id)}?page=1&limit=10`,
        getAuthConfig(),
      )
      .then((response) => {
        if (!active) return;
        setFriendships(response.data.friends || []);
        setPagination(response.data.pagination || null);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              "Unable to load your friends.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !localStorage.getItem("token")) return undefined;

    let active = true;
    axios
      .get(`${API_URL}/friend/view?page=1&limit=10`, getAuthConfig())
      .then((response) => {
        if (!active) return;
        setRequests(response.data.requestlist || []);
        setRequestPagination(response.data.pagination || null);
      })
      .catch((requestError) => {
        if (active)
          setRequestsError(
            requestError.response?.data?.message ||
              "Unable to load friend requests.",
          );
      })
      .finally(() => {
        if (active) setRequestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const loadMoreFriends = async () => {
    if (!pagination?.hasMore || loadingMore || !currentUser?.id) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await axios.get(
        `${API_URL}/friend/list/${encodeURIComponent(currentUser.id)}?page=${nextPage}&limit=10`,
        getAuthConfig(),
      );
      setFriendships((current) => [
        ...current,
        ...(response.data.friends || []),
      ]);
      setPagination(response.data.pagination || null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load more friends.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const removeFriend = async (friendshipId) => {
    if (removingId) return;
    setRemovingId(friendshipId);
    setError("");
    try {
      await axios.delete(
        `${API_URL}/friend/unfriend/${encodeURIComponent(friendshipId)}`,
        getAuthConfig(),
      );
      setFriendships((current) =>
        current.filter((friendship) => friendship.id !== friendshipId),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to remove this friend.",
      );
    } finally {
      setRemovingId("");
    }
  };

  const handleRequest = async (requestId, action) => {
    if (actingRequestId) return;
    setActingRequestId(requestId);
    setError("");
    try {
      await axios.post(
        `${API_URL}/friend/${action}/${encodeURIComponent(requestId)}`,
        {},
        getAuthConfig(),
      );
      setRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );
      setRequestPagination((current) =>
        current
          ? { ...current, total: Math.max(0, current.total - 1) }
          : current,
      );
      if (action === "accept") {
        const response = await axios.get(
          `${API_URL}/friend/list/${encodeURIComponent(currentUser.id)}?page=1&limit=10`,
          getAuthConfig(),
        );
        setFriendships(response.data.friends || []);
        setPagination(response.data.pagination || null);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Unable to ${action} this request.`,
      );
    } finally {
      setActingRequestId("");
    }
  };

  const loadMoreRequests = async () => {
    if (!requestPagination?.hasMore || loadingMoreRequests) return;
    setLoadingMoreRequests(true);
    try {
      const nextPage = requestPagination.page + 1;
      const response = await axios.get(
        `${API_URL}/friend/view?page=${nextPage}&limit=10`,
        getAuthConfig(),
      );
      setRequests((current) => [
        ...current,
        ...(response.data.requestlist || []),
      ]);
      setRequestPagination(response.data.pagination || null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to load more requests.",
      );
    } finally {
      setLoadingMoreRequests(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl items-start">
        <div className="hidden w-64 shrink-0 md:block">
          <Leftbar />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <header className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-700">
                  Your network
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Friends
                </h1>
              </div>
              {!loading && activeTab === "friends" && (
                <span className="text-sm text-slate-500">
                  {pagination?.total ?? friendships.length}{" "}
                  {(pagination?.total ?? friendships.length) === 1
                    ? "friend"
                    : "friends"}
                </span>
              )}
              {activeTab === "requests" && (
                <span className="text-sm text-slate-500">
                  {requestPagination?.total ?? requests.length} pending
                </span>
              )}
            </header>

            <div
              className="mb-5 flex gap-2 border-b border-slate-200"
              role="tablist"
              aria-label="Friends and requests"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "friends"}
                onClick={() => setActiveTab("friends")}
                className={`border-b-2 px-4 py-2 text-sm font-semibold ${activeTab === "friends" ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Friends
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "requests"}
                onClick={() => setActiveTab("requests")}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold ${activeTab === "requests" ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Requests
                {(requestPagination?.total || 0) > 0 && (
                  <span className="rounded-full bg-rose-100 px-1.5 text-xs text-rose-700">
                    {requestPagination.total}
                  </span>
                )}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            {activeTab === "friends" &&
              (loading ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading friends...
                </p>
              ) : friendships.length ? (
                <ul className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
                  {friendships.map((friendship) => {
                    const friend =
                      friendship.requesterId === currentUser?.id
                        ? friendship.reciever
                        : friendship.requester;

                    return (
                      <li
                        key={friendship.id}
                        className="flex items-center gap-3 px-4 py-4 sm:px-5"
                      >
                        <Link
                          to={`/profile/${friend.id}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          {friend.profilePicture ? (
                            <img
                              src={friend.profilePicture}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <FaUserCircle className="h-12 w-12 shrink-0 text-slate-300" />
                          )}
                          <span className="truncate text-sm font-semibold text-slate-900 hover:text-emerald-700">
                            {friend.username}
                          </span>
                        </Link>
                        <Link
                          to={`/messages/${friend.id}`}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                          aria-label={`Message ${friend.username}`}
                        >
                          <FaComments aria-hidden="true" />
                          <span className="hidden sm:inline">Message</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFriend(friendship.id)}
                          disabled={Boolean(removingId)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
                          aria-label={`Remove ${friend.username}`}
                          title="Remove friend"
                        >
                          <FaUserMinus aria-hidden="true" />
                          <span className="hidden sm:inline">
                            {removingId === friendship.id
                              ? "Removing..."
                              : "Remove"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : !error ? (
                <div className="border-y border-slate-200 py-14 text-center">
                  <FaUserCircle
                    className="mx-auto mb-3 text-3xl text-slate-300"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    You haven’t added any friends yet.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Search for people by name to connect.
                  </p>
                </div>
              ) : null)}
            {activeTab === "friends" && pagination?.hasMore && (
              <div className="py-5 text-center">
                <button
                  type="button"
                  onClick={loadMoreFriends}
                  disabled={loadingMore}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more friends"}
                </button>
              </div>
            )}
            {activeTab === "requests" && requestsError && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {requestsError}
              </p>
            )}
            {activeTab === "requests" &&
              (requestsLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading friend requests...
                </p>
              ) : requestsError ? null : requests.length ? (
                <ul className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-5"
                    >
                      <Link
                        to={`/profile/${request.requester.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        {request.requester.profilePicture ? (
                          <img
                            src={request.requester.profilePicture}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <FaUserCircle className="h-11 w-11 shrink-0 text-slate-300" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {request.requester.username}
                          </span>
                          <span className="block text-xs text-slate-500">
                            Sent you a friend request
                          </span>
                        </span>
                      </Link>
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleRequest(request.id, "accept")}
                          disabled={Boolean(actingRequestId)}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          <FaCheck aria-hidden="true" />
                          <span>
                            {actingRequestId === request.id
                              ? "Working..."
                              : "Accept"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequest(request.id, "reject")}
                          disabled={Boolean(actingRequestId)}
                          aria-label={`Decline ${request.requester.username}'s request`}
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
                        >
                          <FaTimes aria-hidden="true" />
                          <span className="hidden sm:inline">Decline</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="border-y border-slate-200 py-14 text-center">
                  <FaUserCircle
                    className="mx-auto mb-3 text-3xl text-slate-300"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    No pending friend requests.
                  </p>
                </div>
              ))}
            {activeTab === "requests" && requestPagination?.hasMore && (
              <div className="py-5 text-center">
                <button
                  type="button"
                  onClick={loadMoreRequests}
                  disabled={loadingMoreRequests}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-60"
                >
                  {loadingMoreRequests ? "Loading..." : "Load more requests"}
                </button>
              </div>
            )}
          </div>
        </main>
        <div className="hidden w-64 shrink-0 lg:block">
          <Rightbar />
        </div>
      </div>
    </div>
  );
};

export default Friends;

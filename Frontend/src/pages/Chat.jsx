import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import {
  FaArrowLeft,
  FaCircle,
  FaPaperPlane,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import Leftbar from "../components/Leftbar";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

const mergeMessage = (currentMessages, message) => {
  const messageIndex = currentMessages.findIndex(
    (item) =>
      item.id === message.id ||
      (message.clientMessageId && item.id === message.clientMessageId),
  );
  if (messageIndex === -1) return [...currentMessages, message];
  const updatedMessages = [...currentMessages];
  updatedMessages[messageIndex] = message;
  return updatedMessages;
};

const Chat = () => {
  const { userId: routeUserId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedUserId = routeUserId || searchParams.get("user");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [loadingConversations, setLoadingConversations] =
    useState(isAuthenticated);
  const [loadedConversationIds, setLoadedConversationIds] = useState(
    () => new Set(),
  );
  const [messageRetry, setMessageRetry] = useState(0);
  const [error, setError] = useState("");
  const activeConversationRef = useRef(activeConversationId);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    const loadConversations = async () => {
      setLoadingConversations(true);
      setError("");
      const directRequested =
        requestedUserId && requestedUserId !== currentUser?.id;
      const conversationsRequest = axios
        .get(`${API_URL}/chat`, getAuthConfig())
        .then((response) => {
          if (!active) return;
          const items = response.data.conversations || [];
          setConversations((existing) => {
            const merged = new Map(items.map((item) => [item.id, item]));
            existing.forEach((item) =>
              merged.set(item.id, { ...merged.get(item.id), ...item }),
            );
            return [...merged.values()];
          });
          if (!directRequested)
            setActiveConversationId(
              (selectedId) => selectedId || items[0]?.id || "",
            );
        })
        .catch((loadError) => {
          if (active)
            setError(
              loadError.response?.data?.error ||
                "Unable to load conversations.",
            );
        })
        .finally(() => {
          if (active) setLoadingConversations(false);
        });

      if (directRequested) {
        try {
          const directConversation = await axios.post(
            `${API_URL}/chat/with/${encodeURIComponent(requestedUserId)}`,
            {},
            getAuthConfig(),
          );
          if (!active) return;
          const conversation = {
            id: directConversation.data.conversationId,
            otherUser: directConversation.data.otherUser,
            lastMessage: null,
          };
          setConversations((existing) => [
            conversation,
            ...existing.filter((item) => item.id !== conversation.id),
          ]);
          setActiveConversationId(conversation.id);
          setLoadingConversations(false);
        } catch (loadError) {
          if (active) {
            setError(
              loadError.response?.data?.error ||
                "Unable to open this conversation.",
            );
            setLoadingConversations(false);
          }
        }
      } else {
        await conversationsRequest;
      }
    };

    loadConversations();
    return () => {
      active = false;
    };
  }, [isAuthenticated, requestedUserId, currentUser?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const client = io(API_URL, { auth: { token } });
    socketRef.current = client;
    client.on("connect", () => {
      setConnected(true);
      setError("");
      if (activeConversationRef.current) {
        client.emit("chat:join", activeConversationRef.current, (result) => {
          if (!result?.ok)
            setError(result?.error || "Unable to join conversation.");
        });
      }
    });
    client.on("disconnect", () => setConnected(false));
    client.on("connect_error", () => {
      setConnected(false);
      setError("Could not connect to chat. Check that the server is running.");
    });
    client.on("presence:sync", (userIds) =>
      setOnlineIds(new Set(userIds || [])),
    );
    client.on("chat:message", (message) => {
      if (message.conversationId === activeConversationRef.current) {
        setMessages((current) => mergeMessage(current, message));
      }
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: message,
                updatedAt: message.createdAt,
              }
            : conversation,
        ),
      );
    });
    client.on("chat:notify", (message) => {
      setConversations((current) => {
        const existing = current.find(
          (conversation) => conversation.id === message.conversationId,
        );
        if (!existing) {
          return [
            {
              id: message.conversationId,
              otherUser: message.sender,
              lastMessage: message,
            },
            ...current,
          ];
        }
        return current.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: message,
                updatedAt: message.createdAt,
              }
            : conversation,
        );
      });
    });
    client.on("presence:update", ({ userId, online }) => {
      setOnlineIds((current) => {
        const updated = new Set(current);
        if (online) updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
    });
    client.on("chat:error", ({ error: message }) =>
      setError(message || "Message could not be sent."),
    );

    return () => {
      client.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const client = socketRef.current;
    if (!client || !activeConversationId) return undefined;
    const joinConversation = () =>
      client.emit("chat:join", activeConversationId, (result) => {
        if (!result?.ok)
          setError(result?.error || "Unable to join conversation.");
      });
    client.on("connect", joinConversation);
    if (client.connected) joinConversation();
    return () => client.off("connect", joinConversation);
  }, [activeConversationId]);

  useEffect(() => {
    if (!isAuthenticated || !activeConversationId) return undefined;

    let active = true;
    axios
      .get(
        `${API_URL}/chat/${encodeURIComponent(activeConversationId)}/messages`,
        getAuthConfig(),
      )
      .then((response) => {
        if (!active) return;
        setMessages((current) => {
          const combined = new Map(
            (response.data.messages || []).map((message) => [
              message.id,
              message,
            ]),
          );
          current.forEach((message) => combined.set(message.id, message));
          return [...combined.values()].sort(
            (left, right) =>
              new Date(left.createdAt) - new Date(right.createdAt),
          );
        });
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError.response?.data?.error || "Unable to load messages.",
          );
      })
      .finally(() => {
        if (active)
          setLoadedConversationIds((current) =>
            new Set(current).add(activeConversationId),
          );
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, activeConversationId, messageRetry]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const activeUser = activeConversation?.otherUser;
  const loadingMessages = Boolean(
    activeConversationId && !loadedConversationIds.has(activeConversationId),
  );
  const connectionLabel = !isAuthenticated
    ? "Sign in required"
    : connected
      ? "Connected"
      : "Connecting...";

  const retryMessages = () => {
    setLoadedConversationIds((current) => {
      const updated = new Set(current);
      updated.delete(activeConversationId);
      return updated;
    });
    setMessageRetry((attempt) => attempt + 1);
    setError("");
  };

  const handleSend = (event) => {
    event.preventDefault();
    const content = draft.trim();
    const socket = socketRef.current;
    if (!content || !activeConversationId || !socket || !connected) return;

    const clientMessageId =
      globalThis.crypto?.randomUUID?.() ||
      `pending-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId: activeConversationId,
      content,
      createdAt: new Date().toISOString(),
      senderId: currentUser?.id,
      sender: currentUser,
      pending: true,
    };
    setMessages((current) => [...current, optimisticMessage]);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              lastMessage: optimisticMessage,
              updatedAt: optimisticMessage.createdAt,
            }
          : conversation,
      ),
    );
    setDraft("");
    setError("");
    socket
      .timeout(15000)
      .emit(
        "chat:message",
        { conversationId: activeConversationId, content, clientMessageId },
        (timeoutError, result) => {
          if (timeoutError || !result?.ok) {
            setMessages((current) =>
              current.filter((message) => message.id !== clientMessageId),
            );
            setDraft((current) => current || content);
            setError(
              result?.error ||
                "Message could not be confirmed. Your text is back in the composer.",
            );
            return;
          }
          if (result.message) {
            setMessages((current) => mergeMessage(current, result.message));
            setConversations((current) =>
              current.map((conversation) =>
                conversation.id === activeConversationId
                  ? {
                      ...conversation,
                      lastMessage: result.message,
                      updatedAt: result.message.createdAt,
                    }
                  : conversation,
              ),
            );
          }
        },
      );
  };

  const getMessagePreview = (message) =>
    message?.content || message?.text || "Start a conversation";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl items-start">
        <div className="hidden w-64 shrink-0 md:block">
          <Leftbar />
        </div>
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4">
          <div className="flex h-[calc(100vh-6.5rem)] min-h-105 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <aside
              className={`${activeConversationId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-slate-200 md:w-64`}
            >
              <div className="border-b border-slate-200 px-4 py-4">
                <h1 className="text-lg font-bold text-slate-900">Messages</h1>
                <p className="mt-1 text-xs text-slate-500">{connectionLabel}</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div
                    className="space-y-1 p-3"
                    aria-label="Loading conversations"
                  >
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="flex animate-pulse items-center gap-3 px-1 py-3"
                      >
                        <span className="h-10 w-10 rounded-full bg-slate-200" />
                        <span className="min-w-0 flex-1">
                          <span className="mb-2 block h-3 w-2/3 rounded bg-slate-200" />
                          <span className="block h-2.5 w-full rounded bg-slate-100" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : !isAuthenticated ? (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    <p>Sign in to see your conversations.</p>
                    <Link
                      to="/login"
                      className="mt-2 inline-block font-semibold text-emerald-800 hover:underline"
                    >
                      Go to sign in
                    </Link>
                  </div>
                ) : conversations.length ? (
                  conversations.map((conversation) => {
                    const person = conversation.otherUser;
                    const isOnline = onlineIds.has(person?.id);
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setMessages([]);
                          setActiveConversationId(conversation.id);
                        }}
                        className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${activeConversationId === conversation.id ? "bg-emerald-50" : ""}`}
                      >
                        <div className="relative shrink-0">
                          {person?.avatar || person?.profilePicture ? (
                            <img
                              src={person.avatar || person.profilePicture}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <FaUserCircle className="h-10 w-10 text-slate-300" />
                          )}
                          {isOnline && (
                            <FaCircle
                              className="absolute bottom-0 right-0 rounded-full bg-white text-[11px] text-emerald-500"
                              aria-label="Online"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {person?.username || "Conversation"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {getMessagePreview(conversation.lastMessage)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-4 py-6 text-sm text-slate-500">
                    No conversations yet. Open a profile and choose Message to
                    start one.
                  </p>
                )}
              </div>
            </aside>

            <section
              className={`${activeConversationId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}
              aria-label="Chat conversation"
            >
              {activeConversation ? (
                <>
                  <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([]);
                        setActiveConversationId("");
                      }}
                      className="p-2 text-slate-500 md:hidden"
                      aria-label="Back to conversations"
                    >
                      <FaArrowLeft />
                    </button>
                    <Link
                      to={`/profile/${activeUser?.id || ""}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      {activeUser?.avatar || activeUser?.profilePicture ? (
                        <img
                          src={activeUser.avatar || activeUser.profilePicture}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle className="h-10 w-10 text-slate-300" />
                      )}
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {activeUser?.username || "Conversation"}
                      </span>
                    </Link>
                    <span className="ml-auto text-xs text-slate-500">
                      {onlineIds.has(activeUser?.id) ? "Online" : "Offline"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([]);
                        setActiveConversationId("");
                      }}
                      className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label="Close chat"
                      title="Close chat"
                    >
                      <FaTimes />
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5">
                    {loadingMessages && messages.length === 0 && (
                      <div className="space-y-4" aria-label="Loading messages">
                        {[0, 1, 2].map((item) => (
                          <div
                            key={item}
                            className={`flex animate-pulse ${item % 2 ? "justify-end" : "justify-start"}`}
                          >
                            <div className="h-12 w-2/3 rounded-lg bg-slate-200" />
                          </div>
                        ))}
                      </div>
                    )}
                    {messages.map((message) => {
                      const mine = message.senderId === currentUser?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3.5 py-2.5 sm:max-w-[70%] ${mine ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-800"}`}
                          >
                            <p className="whitespace-pre-wrap wrap-break-word text-sm">
                              {message.content || message.text}
                            </p>
                            <time
                              className={`mt-1 block text-right text-[10px] ${mine ? "text-emerald-100" : "text-slate-400"}`}
                            >
                              {message.createdAt
                                ? new Date(
                                    message.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </time>
                            {message.pending && (
                              <span className="mt-1 block text-right text-[10px] text-emerald-100">
                                Sending...
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!loadingMessages && messages.length === 0 && !error && (
                      <p className="py-6 text-center text-sm text-slate-500">
                        No messages yet. Send the first one.
                      </p>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {error && (
                    <p
                      role="alert"
                      className="border-t border-rose-100 px-4 py-2 text-xs text-rose-700"
                    >
                      {error}
                    </p>
                  )}
                  {error && activeConversationId && !loadingMessages && (
                    <button
                      type="button"
                      onClick={retryMessages}
                      className="self-start px-4 pb-2 text-xs font-semibold text-emerald-800 hover:underline"
                    >
                      Retry loading messages
                    </button>
                  )}
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 border-t border-slate-200 p-3"
                  >
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        connected ? "Write a message" : "Connecting to chat..."
                      }
                      aria-label="Write a message"
                      className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700"
                      disabled={!connected}
                    />
                    <button
                      type="submit"
                      aria-label="Send message"
                      title="Send message"
                      disabled={!draft.trim() || !connected}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                </>
              ) : (
                <div className="m-auto px-6 text-center">
                  {!isAuthenticated ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        Sign in to use messages
                      </p>
                      <Link
                        to="/login"
                        className="mt-2 inline-block text-sm font-semibold text-emerald-800 hover:underline"
                      >
                        Go to sign in
                      </Link>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane
                        className="mx-auto mb-3 text-2xl text-emerald-700"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-semibold text-slate-800">
                        Choose a conversation
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Start chats from a person’s profile.
                      </p>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;

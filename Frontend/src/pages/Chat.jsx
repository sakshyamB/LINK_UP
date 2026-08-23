import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const Chat = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket() || {};
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const loadConversations = async () => {
    const data = await api("/conversations");
    setConversations(data.conversations);
  };

  const openWith = async (otherId) => {
    const data = await api(`/conversations/with/${otherId}`, { method: "POST" });
    setActive(data);
    socket?.emit("chat:join", data.conversationId);
    const history = await api(`/conversations/${data.conversationId}/messages`);
    setMessages(history.messages);
    navigate(`/chat/${otherId}`, { replace: true });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (userId) openWith(userId);
  }, [userId, socket]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (payload) => {
      if (payload.conversationId === active?.conversationId) {
        setMessages((prev) => [...prev, payload]);
      }
      loadConversations();
    };
    socket.on("chat:message", onMessage);
    return () => socket.off("chat:message", onMessage);
  }, [socket, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active || !socket) return;
    socket.emit("chat:message", {
      conversationId: active.conversationId,
      content: text,
    });
    setText("");
  };

  return (
    <Layout hideRight>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden grid grid-cols-12 min-h-[70vh] max-w-5xl mx-auto">
        <aside className="col-span-12 sm:col-span-4 border-r">
          <h2 className="font-semibold p-3 border-b">Chats</h2>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => conv.otherUser && openWith(conv.otherUser.id)}
              className={`w-full text-left px-3 py-3 border-b hover:bg-gray-50 ${
                active?.conversationId === conv.id ? "bg-blue-50" : ""
              }`}
            >
              <p className="font-medium">{conv.otherUser?.username}</p>
              <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content}</p>
            </button>
          ))}
        </aside>
        <section className="col-span-12 sm:col-span-8 flex flex-col">
          {!active && <p className="m-auto text-gray-500">Select a conversation.</p>}
          {active && (
            <>
              <div className="p-3 border-b font-semibold flex justify-between">
                <span>{active.otherUser?.username}</span>
                <button
                  onClick={() => navigate(`/call/${active.otherUser.id}`)}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                >
                  Video
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                      msg.senderId === user.id
                        ? "ml-auto bg-blue-600 text-white"
                        : "bg-white border"
                    }`}
                  >
                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="rounded mb-1 max-h-40" />}
                    <p>{msg.content}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 border rounded-full px-4 py-2"
                />
                <button className="bg-blue-600 text-white px-4 rounded-full">Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Chat;

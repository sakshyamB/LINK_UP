import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { API_URL } from "../api";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user || !token) {
      setSocket(null);
      return;
    }

    const instance = io(import.meta.env.VITE_SOCKET_URL || API_URL, {
      auth: { token },
    });

    instance.on("presence:update", ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    instance.on("call:incoming", (payload) => {
      setIncomingCall(payload);
    });

    instance.on("call:ended", () => setIncomingCall(null));

    setSocket(instance);
    return () => instance.disconnect();
  }, [user]);

  const value = useMemo(
    () => ({ socket, onlineIds, incomingCall, setIncomingCall }),
    [socket, onlineIds, incomingCall]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
      {incomingCall && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm text-center shadow-xl">
            <p className="text-sm text-gray-500">Incoming video call</p>
            <p className="text-xl font-semibold mt-2">{incomingCall.from?.username}</p>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 bg-gray-200 rounded-lg py-2"
                onClick={() => {
                  socket?.emit("call:end", {
                    roomId: incomingCall.roomId,
                    toUserId: incomingCall.from?.id,
                  });
                  setIncomingCall(null);
                }}
              >
                Decline
              </button>
              <button
                className="flex-1 bg-green-600 text-white rounded-lg py-2"
                onClick={() => {
                  const roomId = incomingCall.roomId;
                  setIncomingCall(null);
                  navigate(`/call/${incomingCall.from.id}?room=${roomId}`);
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

import { useEffect, useState } from "react";
import { ImCross } from "react-icons/im";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useSocket } from "../context/SocketContext";

const Rightbar = ({ isrightsidebaropen, setisrightsidebaropen }) => {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const { onlineIds } = useSocket() || { onlineIds: new Set() };
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [reqData, notifData, friendData] = await Promise.all([
        api("/friends/requests"),
        api("/users/notifications"),
        api("/friends"),
      ]);
      setRequests(reqData.requests);
      setNotifications(notifData.notifications);
      setFriends(friendData.friends);
    } catch {
      /* not signed in */
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      if (!setisrightsidebaropen) return;
      setisrightsidebaropen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setisrightsidebaropen]);

  const respond = async (id, action) => {
    await api(`/friends/requests/${id}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    load();
  };

  return (
    <div
      className={`${
        isrightsidebaropen ? "w-[80%] md:w-[32%] lg:w-[24%]" : "w-0"
      } h-[calc(100vh-4rem)] fixed right-0 top-16 overflow-y-auto border-l bg-gray-100 transition-all duration-300 z-40`}
    >
      <div className="flex md:hidden justify-end pt-2 pr-5">
        <ImCross
          onClick={() => setisrightsidebaropen?.(false)}
          className="text-red-500 cursor-pointer"
        />
      </div>
      <div className="p-3 space-y-4">
        <section className="bg-white rounded-xl p-3 shadow-sm">
          <p className="font-semibold mb-2">Friend requests</p>
          {requests.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
          {requests.map((item) => (
            <div key={item.id} className="flex items-center gap-2 mb-2">
              <button
                className="font-medium text-left flex-1"
                onClick={() => navigate(`/profile/${item.user.id}`)}
              >
                {item.user.username}
              </button>
              <button
                onClick={() => respond(item.id, "accept")}
                className="bg-blue-500 text-white text-sm px-2 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => respond(item.id, "reject")}
                className="bg-red-500 text-white text-sm px-2 py-1 rounded"
              >
                Decline
              </button>
            </div>
          ))}
        </section>
        <section className="bg-white rounded-xl p-3 shadow-sm">
          <p className="font-semibold mb-2">Notifications</p>
          {notifications.length === 0 && <p className="text-sm text-gray-500">Nothing new.</p>}
          {notifications.slice(0, 8).map((item) => (
            <p key={item.id} className="text-sm mb-2 text-gray-700">
              {item.message}
            </p>
          ))}
        </section>
        <section className="bg-white rounded-xl p-3 shadow-sm">
          <p className="font-semibold mb-2">Friends</p>
          {friends.length === 0 && <p className="text-sm text-gray-500">Add friends to chat and call.</p>}
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => navigate(`/chat/${friend.id}`)}
              className="flex w-full items-center gap-2 py-1"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  onlineIds.has(friend.id) ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span>{friend.username}</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Rightbar;

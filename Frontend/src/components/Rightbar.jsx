import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
});

const Rightbar = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userId = currentUser?.id;
  const hasToken = Boolean(localStorage.getItem('token'));
  const [friends, setFriends] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const initialState = userId && hasToken ? 'loading' : 'empty';
  const [friendsState, setFriendsState] = useState(initialState);
  const [messagesState, setMessagesState] = useState(initialState);

  useEffect(() => {
    if (!userId || !hasToken) return undefined;

    let active = true;
    axios.get(`${API_URL}/friend/list/${encodeURIComponent(userId)}`, getAuthConfig())
      .then((response) => {
        if (!active) return;
        const uniqueFriends = new Map();
        (response.data.friends || []).forEach(({ requester, reciever }) => {
          const friend = requester?.id === userId ? reciever : requester;
          if (friend?.id) uniqueFriends.set(friend.id, friend);
        });
        setFriends([...uniqueFriends.values()]);
        setFriendsState('loaded');
      })
      .catch(() => {
        if (active) setFriendsState('error');
      });

    axios.get(`${API_URL}/chat`, getAuthConfig())
      .then((response) => {
        if (!active) return;
        setRecentMessages((response.data.conversations || []).filter((conversation) => conversation.otherUser));
        setMessagesState('loaded');
      })
      .catch(() => {
        if (active) setMessagesState('error');
      });

    return () => {
      active = false;
    };
  }, [userId, hasToken]);

  const formatTime = (date) => date
    ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  return (
    <aside className="w-full h-[calc(100vh-4rem)] sticky top-16 bg-white border-l border-slate-200/80 flex flex-col p-4 select-none space-y-6 overflow-y-auto">
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Friends
          </h2>
          <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {friends.length}
          </span>
        </div>

        <div className="space-y-2">
          {friends.map((friend) => (
            <Link
              key={friend.id}
              to={`/profile/${friend.id}`}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-50 transition group"
            >
              {friend.profilePicture ? (
                <img src={friend.profilePicture} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <FaUserCircle className="h-9 w-9 shrink-0 text-slate-300" />
              )}
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition">
                  {friend.username}
                </span>
              </div>
            </Link>
          ))}
          {friendsState === 'loading' && <div className="space-y-3 px-2 py-2" aria-label="Loading friends">{[0, 1, 2].map((item) => <div key={item} className="flex animate-pulse items-center gap-3"><span className="h-9 w-9 rounded-full bg-slate-200" /><span className="h-3 flex-1 rounded bg-slate-100" /></div>)}</div>}
          {friendsState === 'error' && <p className="px-2 py-2 text-xs text-slate-500">Friends could not be loaded.</p>}
          {(friendsState === 'empty' || (friendsState === 'loaded' && friends.length === 0)) && <p className="px-2 py-2 text-xs text-slate-400">No friends yet.</p>}
        </div>
      </div>

      <hr className="border-slate-100 my-2" />

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent Messages
          </h2>
          <Link
            to="/messages"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {recentMessages.map((conversation) => {
            const person = conversation.otherUser;
            const message = conversation.lastMessage;
            const preview = message?.content || message?.text || 'No messages yet';
            const timestamp = message?.createdAt || message?.sendAt || conversation.updatedAt;

            return (
            <Link
              key={conversation.id}
              to={person?.id ? `/messages/${person.id}` : '/messages'}
              className="flex items-start space-x-3 rounded-xl p-2.5 transition hover:bg-slate-50"
            >
              {person?.avatar || person?.profilePicture ? (
                <img src={person.avatar || person.profilePicture} alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : <FaUserCircle className="mt-0.5 h-9 w-9 shrink-0 text-slate-300" />}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-semibold text-slate-800">
                    {person?.username || 'Conversation'}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-400">{formatTime(timestamp)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {preview}
                </p>
              </div>
            </Link>
            );
          })}
          {messagesState === 'loading' && <div className="space-y-3 px-2 py-2" aria-label="Loading messages">{[0, 1].map((item) => <div key={item} className="flex animate-pulse items-center gap-3"><span className="h-9 w-9 rounded-full bg-slate-200" /><span className="min-w-0 flex-1"><span className="mb-2 block h-3 w-1/2 rounded bg-slate-200" /><span className="block h-2.5 w-full rounded bg-slate-100" /></span></div>)}</div>}
          {messagesState === 'error' && <p className="px-2 py-2 text-xs text-slate-500">Messages could not be loaded.</p>}
          {(messagesState === 'empty' || (messagesState === 'loaded' && recentMessages.length === 0)) && <p className="px-2 py-2 text-xs text-slate-400">No conversations yet.</p>}
        </div>
      </div>

    </aside>
  );
};

export default Rightbar;
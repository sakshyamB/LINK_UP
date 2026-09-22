import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {FaCog,FaComments,FaHome,FaSignOutAlt,FaUser,FaUserFriends,FaUserCircle,} from 'react-icons/fa';

const Leftbar = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <aside className="min-h-[calc(100vh-73px)] w-full max-w-xs border-r border-slate-200 bg-white px-4 py-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-indigo-50 p-4">
        <FaUserCircle className="text-3xl text-indigo-500" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-400">Welcome back</p>
          <p className="truncate text-sm font-bold text-slate-800">{user?.username || 'User'}</p>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <FaHome />
          Home
        </Link>
        <Link to="/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">
          <FaUser />
          Profile
        </Link>
        <Link to="/friends" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">
          <FaUserFriends />
          Friends
        </Link>
        <Link to="/messages" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">
          <FaComments />
          Messages
        </Link>
        <Link to="/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600">
          <FaCog />
          Settings
        </Link>
      </nav>

      <button
        onClick={handleLogout}
        className="mt-8 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-4 py-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
      >
        <FaSignOutAlt className="text-rose-500" />
        Log Out
      </button>
    </aside>
  );
};

export default Leftbar;

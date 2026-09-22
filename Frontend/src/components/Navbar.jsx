import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaComments, FaUserCircle, FaSignOutAlt, FaUser, FaCog } from 'react-icons/fa';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = user || storedUser;
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-sm px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight hover:opacity-90 transition">
            LinkUp
          </Link>
        </div>

        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-100 text-slate-800 text-sm pl-10 pr-4 py-2 rounded-full border border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none transition"
            />
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          </form>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          
          <button 
            aria-label="Notifications"
            className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition"
          >
            <FaBell className="text-lg" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          <button 
            aria-label="Messages"
            className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition"
          >
            <FaComments className="text-lg" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 focus:outline-none transition"
            >
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt={currentUser?.username || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <FaUserCircle className="text-2xl text-slate-600" />
              )}
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                {currentUser?.username || 'User'}
              </span>
            </button>

            {isProfileMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <Link
                  to="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <FaUser className="mr-2.5 text-slate-400" />
                  View Profile
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <FaCog className="mr-2.5 text-slate-400" />
                  Settings
                </Link>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <FaSignOutAlt className="mr-2.5 text-rose-500" />
                  Log Out
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
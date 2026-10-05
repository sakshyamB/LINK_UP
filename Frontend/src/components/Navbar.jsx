import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaComments, FaUserCircle, FaSignOutAlt, FaUser, FaCog, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatOpen = location.pathname === '/messages' || location.pathname.startsWith('/messages/');
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUser = user || storedUser;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const loadNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setNotificationError('Sign in to view notifications.');
      return;
    }

    setNotificationsLoading(true);
    setNotificationError('');
    try {
      const response = await axios.get(`${API_URL}/notification/get`, {
        params: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications || []);
      setNotificationCount(response.data.pagination?.total || 0);
    } catch (error) {
      setNotificationError(error.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    axios.get(`${API_URL}/notification/get`, {
      params: { page: 1, limit: 10 },
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      if (!active) return;
      setNotifications(response.data.notifications || []);
      setNotificationCount(response.data.pagination?.total || 0);
    }).catch(() => {
      if (active) setNotificationCount(0);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleNotificationClick = () => {
    const shouldOpen = !isNotificationOpen;
    setIsNotificationOpen(shouldOpen);
    setIsProfileMenuOpen(false);
    if (shouldOpen) loadNotifications();
  };

  const toggleChat = () => {
    setIsNotificationOpen(false);
    setIsProfileMenuOpen(false);
    if (isChatOpen) {
      navigate(location.state?.chatReturnTo || '/');
      return;
    }

    navigate('/messages', {
      state: { chatReturnTo: `${location.pathname}${location.search}` },
    });
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/notification/delete/${encodeURIComponent(notificationId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
      setNotificationCount((current) => Math.max(0, current - 1));
    } catch (error) {
      setNotificationError(error.response?.data?.message || 'Unable to dismiss notification.');
    }
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/user/search`, {
          params: { query, limit: 6 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        setSearchResults(response.data.users || []);
      } catch {
        if (!controller.signal.aborted) setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      navigate(`/profile/${searchResults[0].id}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  const handleSearchResultClick = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-sm px-4 py-2.5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4">
        
        <div className="flex items-center">
          <Link to="/" className="text-xl font-extrabold text-indigo-600 tracking-tight hover:opacity-90 transition sm:text-2xl">
            LinkUp
          </Link>
        </div>

        <div className="relative min-w-0 max-w-md flex-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchFocused(false);
              }}
              placeholder="Search people"
              aria-label="Search people by name"
              aria-autocomplete="list"
              className="w-full rounded-full border border-transparent bg-slate-100 py-2 pl-9 pr-2 text-sm text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:outline-none sm:pl-10 sm:pr-4"
            />
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          </form>
          {isSearchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {searchLoading ? (
                <p className="px-4 py-3 text-sm text-slate-500">Searching people...</p>
              ) : searchResults.length > 0 ? (
                <ul role="listbox" aria-label="People matching your search">
                  {searchResults.map((result) => (
                    <li key={result.id} role="option" aria-selected="false">
                      <Link
                        to={`/profile/${result.id}`}
                        onClick={handleSearchResultClick}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-slate-50"
                      >
                        {result.profilePicture ? (
                          <img src={result.profilePicture} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 font-semibold text-white">
                            {result.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                        <span className="truncate font-medium">{result.username}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-slate-500">No people found.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          
          <div className="relative">
          <button
            type="button"
            onClick={handleNotificationClick}
            aria-label="Notifications"
            aria-expanded={isNotificationOpen}
            aria-haspopup="dialog"
            title="Notifications"
            className="relative rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 sm:p-2"
          >
            <FaBell className="text-base sm:text-lg" />
            {notificationCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">{notificationCount > 9 ? '9+' : notificationCount}</span>}
          </button>
          {isNotificationOpen && (
            <section role="dialog" aria-label="Notifications" className="fixed right-3 top-17 z-50 flex max-h-[min(70vh,28rem)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
                <button type="button" onClick={() => setIsNotificationOpen(false)} aria-label="Close notifications" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><FaTimes /></button>
              </header>
              <div className="min-h-0 overflow-y-auto">
                {notificationError ? (
                  <p role="alert" className="px-4 py-5 text-sm text-rose-700">{notificationError}</p>
                ) : notificationsLoading ? (
                  <p className="px-4 py-5 text-sm text-slate-500">Loading notifications...</p>
                ) : notifications.length ? (
                  <ul className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <li key={notification.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-800">{notification.message}</p>
                          <time className="mt-1 block text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time>
                        </div>
                        <button type="button" onClick={() => deleteNotification(notification.id)} aria-label="Dismiss notification" title="Dismiss" className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"><FaTimes /></button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">You’re all caught up.</p>
                )}
              </div>
            </section>
          )}
          </div>

          <button
            type="button"
            onClick={toggleChat}
            aria-label={isChatOpen ? 'Close messages' : 'Open messages'}
            aria-pressed={isChatOpen}
            title={isChatOpen ? 'Close messages' : 'Messages'}
            className="relative rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 sm:p-2"
          >
            <FaComments className="text-base sm:text-lg" />
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
                  to={currentUser?.id ? `/profile/${currentUser.id}` : "/profile"}
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
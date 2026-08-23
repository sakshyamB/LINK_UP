import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CiSearch, CiBellOn } from "react-icons/ci";
import { MdOutlineWbSunny } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import { IoMoonOutline } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { IoIosMenu } from "react-icons/io";
import { BsChatDots } from "react-icons/bs";
import { HiVideoCamera } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const Navbar = ({ setisleftsidebaropen, setisrightsidebaropen }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(data.users);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="w-full fixed z-50 top-0 left-0 bg-black h-16 flex items-center px-3 gap-2">
      <Link to="/">
        <h1 className="italic text-white text-2xl hidden sm:block">SocialApp</h1>
      </Link>
      <div className="flex items-center">
        <Link to="/">
          <FaHome className="text-white mx-2 text-2xl" />
        </Link>
        {darkMode ? (
          <MdOutlineWbSunny
            onClick={() => setDarkMode(false)}
            className="text-white hidden sm:block text-2xl cursor-pointer"
          />
        ) : (
          <IoMoonOutline
            onClick={() => setDarkMode(true)}
            className="text-white hidden sm:block text-2xl cursor-pointer"
          />
        )}
        <IoIosMenu
          onClick={() => setisleftsidebaropen?.((prev) => !prev)}
          className="text-white mx-2 text-2xl sm:hidden cursor-pointer"
        />
      </div>
      <div className="relative flex-1 flex items-center">
        <CiSearch className="text-2xl hidden sm:block text-white mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people..."
          className="w-[80%] sm:w-[60%] text-sm sm:text-base p-2 rounded-md text-white bg-transparent border border-white/40 outline-none"
        />
        {results.length > 0 && (
          <div className="absolute top-12 left-0 sm:left-8 w-[80%] sm:w-[60%] bg-white rounded-lg shadow-lg overflow-hidden z-50">
            {results.map((item) => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  navigate(`/profile/${item.id}`);
                }}
              >
                <img
                  src={item.avatar || `https://ui-avatars.com/api/?name=${item.username}`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{item.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center">
        <Link to="/chat">
          <BsChatDots className="text-white mx-2 text-xl" />
        </Link>
        <Link to="/friends">
          <HiVideoCamera className="text-white mx-2 text-xl" />
        </Link>
        <CiBellOn
          onClick={() => setisrightsidebaropen?.((prev) => !prev)}
          className="text-white mx-2 text-2xl cursor-pointer"
        />
        <Link to={user ? `/profile/${user.id}` : "/login"}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover mx-2" />
          ) : (
            <CgProfile className="text-blue-400 text-2xl mx-2" />
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navbar;

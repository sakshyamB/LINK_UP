import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { FaUserFriends } from "react-icons/fa";
import { BsChatDots } from "react-icons/bs";
import { CiVideoOn } from "react-icons/ci";
import { IoMdSettings } from "react-icons/io";
import { MdOutlineHelpOutline } from "react-icons/md";
import { ImCross } from "react-icons/im";
import { useAuth } from "../context/AuthContext";

const Item = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg">
    {icon}
    <span>{label}</span>
  </Link>
);

const Leftbar = ({
  isleftsidebaropen,
  setislogoutclicked,
  setisleftsidebaropen,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkScreenSize = () => {
      if (!setisleftsidebaropen) return;
      setisleftsidebaropen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setisleftsidebaropen]);

  return (
    <div
      className={`h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto ${
        isleftsidebaropen ? "w-[80%] md:w-[25%] lg:w-[22%]" : "w-0"
      } border-r bg-white transition-all duration-300 z-40`}
    >
      <div className="flex sm:hidden justify-end pt-2 pr-5">
        <ImCross
          onClick={() => setisleftsidebaropen?.(false)}
          className="text-red-500 cursor-pointer"
        />
      </div>
      <div className="p-3 space-y-1">
        <button
          onClick={() => user && navigate(`/profile/${user.id}`)}
          className="flex items-center gap-3 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-lg"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <CgProfile className="text-blue-400 text-2xl" />
          )}
          <span className="font-medium">{user?.username || "Guest"}</span>
        </button>
        <Item to="/friends" icon={<FaUserFriends className="text-cyan-500 text-2xl" />} label="Friends" />
        <Item to="/chat" icon={<BsChatDots className="text-blue-500 text-2xl" />} label="Messenger" />
        <Item to="/friends" icon={<CiVideoOn className="text-pink-400 text-2xl" />} label="Video call" />
        <Item to={`/profile/${user?.id || ""}`} icon={<IoMdSettings className="text-amber-500 text-2xl" />} label="Profile settings" />
        <div className="flex items-center gap-3 px-3 py-2 text-gray-500">
          <MdOutlineHelpOutline className="text-amber-300 text-2xl" />
          <span>Help and Support</span>
        </div>
        <button
          onClick={() => setislogoutclicked?.(true)}
          className="mt-4 w-full bg-gray-100 border rounded-lg py-2 hover:bg-gray-200"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Leftbar;

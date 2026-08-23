import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Leftbar from "./Leftbar";
import Rightbar from "./Rightbar";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children, hideRight = false }) => {
  const [isleftsidebaropen, setisleftsidebaropen] = useState(false);
  const [isrightsidebaropen, setisrightsidebaropen] = useState(false);
  const [islogoutclicked, setislogoutclicked] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        setisleftsidebaropen={setisleftsidebaropen}
        setisrightsidebaropen={setisrightsidebaropen}
      />
      <div className="pt-16">
        <Leftbar
          setislogoutclicked={setislogoutclicked}
          isleftsidebaropen={isleftsidebaropen}
          setisleftsidebaropen={setisleftsidebaropen}
        />
        <div className={`md:ml-[25%] lg:ml-[22%] ${hideRight ? "" : "lg:mr-[24%] md:mr-[32%]"} px-3 py-4`}>
          {children}
        </div>
        {!hideRight && (
          <Rightbar
            isrightsidebaropen={isrightsidebaropen}
            setisrightsidebaropen={setisrightsidebaropen}
          />
        )}
      </div>
      {islogoutclicked && (
        <div className="w-full h-screen fixed top-0 left-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Are you sure you want to log out?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setislogoutclicked(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <Link to="/login" onClick={() => logout()}>
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Log Out
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

import { useState } from "react";
import Leftbar from "../components/Leftbar";
import Logoutpopup from "../components/Logoutpopup";
import Navbar from "../components/Navbar";
import Rightbar from "../components/Rightbar";
import Userprofile from "../components/Profile";

const Profile = () => {
	const [isLogoutPopupOpen, setLogoutpopup] = useState(false);

	return (
		<div className="min-h-screen bg-slate-50">
			<Navbar />
			<div className="mx-auto flex w-full max-w-6xl items-start">
				<div className="hidden w-64 shrink-0 md:block">
					<Leftbar setlogoutpopup={setLogoutpopup} />
				</div>
				<div className="min-w-0 flex-1 py-2">
					<Userprofile />
				</div>
				<div className="hidden w-64 shrink-0 md:block">
					<Rightbar />
				</div>
			</div>
			{isLogoutPopupOpen && <Logoutpopup setLogoutpopup={setLogoutpopup} />}
		</div>
	);
};

export default Profile;

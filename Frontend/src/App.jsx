import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
// import Profile from "./pages/Profile";
// import Friends from "./pages/Friends";
// import VideoCall from "./pages/VideoCall";
// import OAuthCallback from "./pages/OAuthCallback";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/"element={<Home />}/>
    {/* <Route path="/oauth/callback" element={<OAuthCallback />} />
    <Route path="/profile/:id" element={<Profile />}/>
    <Route path="/friends" element={<Friends />}/>
    <Route path="/chat" element={<Chat />}/>
    <Route path="/chat/:userId" element={ <Chat />}/>
    <Route path="/call/:userId" element={<VideoCall />}/> */}
  </Routes>
);

export default App;

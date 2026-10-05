import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";

const RequireAuth = () =>
  localStorage.getItem("token") ? <Outlet /> : <Navigate to="/login" replace />;

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route element={<RequireAuth />}>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/messages" element={<Chat />} />
      <Route path="/messages/:userId" element={<Chat />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/setting" element={<Settings />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
  </Routes>
);

export default App;

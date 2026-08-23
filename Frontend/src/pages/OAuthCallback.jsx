import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OAuthCallback = () => {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login?error=oauth");
      return;
    }
    loginWithToken(token)
      .then(() => navigate("/"))
      .catch(() => navigate("/login?error=oauth"));
  }, [params, loginWithToken, navigate]);

  return (
    <div className="min-h-screen grid place-items-center text-gray-600">
      Completing Google sign-in...
    </div>
  );
};

export default OAuthCallback;

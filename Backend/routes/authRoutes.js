const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { signToken } = require("../lib/tokens");
const { googleReady } = require("../passport");

const authRoutes = express.Router();

authRoutes.post("/signup", authController.PostSignUp);
authRoutes.post("/login", authController.PostLogin);
authRoutes.get("/me", auth, authController.Me);

authRoutes.get("/google", (req, res, next) => {
  if (!googleReady()) {
    return res.status(501).json({
      error:
        "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Backend/.env.",
    });
  }
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

authRoutes.get(
  "/google/callback",
  (req, res, next) => {
    if (!googleReady()) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth`);
    }
    return passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth`,
    })(req, res, next);
  },
  (req, res) => {
    const token = signToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}`);
  }
);

module.exports = authRoutes;

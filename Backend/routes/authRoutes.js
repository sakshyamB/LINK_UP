const express = require("express");
const authController = require("../controllers/authController");
const OauthController = require('../controllers/OauthController')

const authRoutes = express.Router();

authRoutes.post("/signup", authController.PostSignup);
authRoutes.post("/login", authController.PostLogin);
authRoutes.post('/google', OauthController.PostGoogleAuth)

module.exports = authRoutes;

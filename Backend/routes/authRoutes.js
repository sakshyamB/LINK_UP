const express = require("express");
const authController = require("../controllers/authController");

const authRoutes = express.Router();

authRoutes.post("/signup", authController.PostSignup);
authRoutes.post("/login", authController.PostLogin);

module.exports = authRoutes;

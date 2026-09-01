const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const userRoutes = express.Router();

userRoutes.get("/search", authMiddleware, userController.searchUsers);

module.exports = userRoutes;
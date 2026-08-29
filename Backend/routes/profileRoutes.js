const express = require ("express");
const ProfileController = require("../controllers/profilecontroller");
const authMiddleware = require("../middleware/authMiddleware");

const profileRoutes = express.Router();

profileRoutes.get('/me', authMiddleware, ProfileController.Myprofile);
profileRoutes.get('/:id', authMiddleware, ProfileController.UserProfile);
profileRoutes.patch('/update', authMiddleware, ProfileController.UpdateProfile);

module.exports = profileRoutes;
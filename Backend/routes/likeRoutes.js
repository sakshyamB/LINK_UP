const express = require('express');
const likeController = require('../controllers/likeController');
const authMiddleware = require('../middleware/authMiddleware');

const likeRoutes = express.Router();

likeRoutes.post("/toggle/:postId", authMiddleware, likeController.togglelikes);
likeRoutes.get("/get/:postId", authMiddleware, likeController.getlikes);

module.exports = likeRoutes;
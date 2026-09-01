const express = require('express');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

const commentRoutes = express.Router();

commentRoutes.post("/create/:postId", authMiddleware, commentController.createComment);
commentRoutes.get("/get/:postId", authMiddleware, commentController.getComments);
commentRoutes.put("/update/:commentId", authMiddleware, commentController.updateComment);
commentRoutes.delete("/delete/:commentId", authMiddleware, commentController.deleteComment);

module.exports = commentRoutes;
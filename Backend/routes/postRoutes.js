const express = require("express");
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware")

const postRoutes = express.Router();

postRoutes.post("/create", authMiddleware, postController.createPost);
postRoutes.get("/user/:id", authMiddleware, postController.getPost);
postRoutes.get("/all", authMiddleware, postController.getAllPost);

module.exports = postRoutes;

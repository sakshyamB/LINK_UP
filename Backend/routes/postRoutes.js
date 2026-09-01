const express = require("express");
const postController = require("../controllers/postController");
const authMiddleware = require("../middleware/authMiddleware")

const postRoutes = express.Router();

postRoutes.post("/create", authMiddleware, postController.createPost);
postRoutes.get("/user/:id", authMiddleware, postController.getuserPost);
postRoutes.get("/all", authMiddleware, postController.getAllpost);
postRoutes.delete("/delete/:postId", authMiddleware, postController.deletePost);
postRoutes.put("/update/:postId", authMiddleware, postController.updatePost);
postRoutes.get("/single/:postId", authMiddleware, postController.getSinglePost);
postRoutes.get("/feed", authMiddleware, postController.getFeed);

module.exports = postRoutes;

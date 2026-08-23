const express = require("express");
const multer = require("multer");
const postController = require("../controllers/postController");
const { auth, optionalAuth } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.get("/", optionalAuth, postController.listPosts);
router.post("/", auth, upload.single("image"), postController.createPost);
router.post("/:id/like", auth, postController.toggleLike);
router.post("/:id/comments", auth, postController.addComment);
router.get("/user/:userId", optionalAuth, postController.userPosts);

module.exports = router;

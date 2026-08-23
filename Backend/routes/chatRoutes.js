const express = require("express");
const multer = require("multer");
const chatController = require("../controllers/chatController");
const { auth } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.get("/", auth, chatController.listConversations);
router.post("/with/:userId", auth, chatController.getOrCreateConversation);
router.get("/:id/messages", auth, chatController.getMessages);
router.post("/:id/messages", auth, upload.single("image"), chatController.sendMessageHttp);

module.exports = router;

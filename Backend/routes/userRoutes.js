const express = require("express");
const multer = require("multer");
const userController = require("../controllers/userController");
const { auth } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.get("/search", auth, userController.searchUsers);
router.get("/notifications", auth, userController.notifications);
router.post("/notifications/read", auth, userController.markNotificationsRead);
router.patch(
  "/me",
  auth,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  userController.updateProfile
);
router.get("/:id", auth, userController.getUser);

module.exports = router;

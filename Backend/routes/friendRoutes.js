const express = require("express");
const friendController = require("../controllers/friendController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, friendController.listFriends);
router.get("/requests", auth, friendController.pendingRequests);
router.post("/:userId", auth, friendController.sendRequest);
router.post("/requests/:id", auth, friendController.respondRequest);

module.exports = router;

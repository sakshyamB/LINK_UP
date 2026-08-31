const express = require("express");
const friendController = require("../controllers/friendController");
const authMiddleware = require("../middleware/authMiddleware");

const friendRoutes = express.Router();

friendRoutes.post("/send/:recieverId", authMiddleware, friendController.sendFriendRequest);
friendRoutes.get("/view", authMiddleware, friendController.viewFriendRequest);
friendRoutes.post("/accept/:requestId", authMiddleware, friendController.acceptFriendRequest);
friendRoutes.post("/reject/:requestId", authMiddleware, friendController.rejectFriendRequest);
friendRoutes.delete("/cancel/:requestId", authMiddleware, friendController.cancelrequest);
friendRoutes.delete("/unfriend/:requestId", authMiddleware, friendController.unfriend);

module.exports = friendRoutes;

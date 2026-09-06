const express = require ("express")
const authMiddleware = require("../middleware/authMiddleware")
const notificationController = require("../controllers/notificationController")

const notificationRoutes = express.Router();

notificationRoutes.get("/get", authMiddleware, notificationController.getNotifications);
notificationRoutes.delete("/delete/:notificationId", authMiddleware, notificationController.deleteNotification);

module.exports = notificationRoutes;
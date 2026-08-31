const express = require ("express")
const authMiddleware = require("../middleware/authMiddleware")
const notificationController = require("../controllers/notificationController")

const notificationRoutes = express.Router();

notificationRoutes.get("/get", authMiddleware, notificationController);
notificationRoutes.delete("/delete/:notificationId", authMiddleware, notificationController);

module.exports = notificationRoutes;
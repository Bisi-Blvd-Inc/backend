const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");
const notificationController = require("../../controllers/frontend/notification.controller");

router.get("/getNotification",authMiddleware, notificationController.getNotification);
router.get("/adminNotification", notificationController.getAdminNotification);
router.put("/update", notificationController.updateNotification);

module.exports = router;

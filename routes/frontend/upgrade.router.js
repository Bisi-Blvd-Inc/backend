const express = require("express");
const router = express.Router();
const upgradeController = require("../../controllers/frontend/upgrade.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

router.post("/create", authMiddleware, upgradeController.createPlan);
router.delete("/remove/:id", authMiddleware, upgradeController.removePlan);

module.exports = router;

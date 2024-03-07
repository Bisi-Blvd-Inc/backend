const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/frontend/business.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

router.get("/getAll", businessController.getAllbussTypes);
router.get("/getAllFrontenduse", businessController.getAllFrontendbussTypes);

router.get("/getUserServcie",authMiddleware, businessController.getUserService);
router.get("/getAdminService",authMiddleware, businessController.getAdminService);
router.get("/getAllFrontenduseforsignup", businessController.getAllFrontendbussTypesForsignup);

module.exports = router;

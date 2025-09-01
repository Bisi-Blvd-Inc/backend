const express = require("express");
const router = express.Router();
const enterpriseController = require("../../controllers/frontend/enterprise.controller");
const adminEnterpriseController = require("../../controllers/admin/enterprise.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

router.post("/join", enterpriseController.joinEnterprise);
router.get(
  "/getById/:id",
  authMiddleware,
  enterpriseController.getEnterpriseByUserId
);
router.get("/get/:key", enterpriseController.getEnterpriseByKey);
router.post(
  "/sendActivationKey",
  authMiddleware,
  enterpriseController.generateAndSendActivationKey
);
router.get(
  "/deleteKey/:key",
  authMiddleware,
  adminEnterpriseController.deleteEnterpriseKey
);

module.exports = router;

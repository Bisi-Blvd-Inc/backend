const express = require("express");
const router = express.Router();
const enterpriseController = require("../../controllers/frontend/enterprise.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

router.post("/join", enterpriseController.joinEnterprise);
router.get(
  "/getById/:id",
  authMiddleware,
  enterpriseController.getEnterpriseByUserId
);
router.get("/get/:key", enterpriseController.getEnterpriseByKey);

module.exports = router;

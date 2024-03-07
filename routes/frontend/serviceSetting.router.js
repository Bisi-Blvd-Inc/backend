const express = require("express");
const router = express.Router();
const serviceSettingController = require("../../controllers/frontend/serviceSetting.controller");

router.post("/addService", serviceSettingController.createService);
router.post("/stripeDetail", serviceSettingController.updateStripeDetail);
router.get("/get", serviceSettingController.getService);
router.put("/update",serviceSettingController.updateService)


module.exports = router;

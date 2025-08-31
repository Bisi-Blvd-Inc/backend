const express = require("express");
const router = express.Router();
const businessClassController = require("../../controllers/frontend/businessClass.controller");
const {authMiddleware} = require("../../middlewares/frontend/authMiddleware");

router.post("/addClass", businessClassController.create);
router.get("/get", businessClassController.getClassById);
router.get("/getProviderClasses/:id", authMiddleware, businessClassController.getClassByProviderId);
router.put("/update/:id", businessClassController.updateClass);
router.delete("/delete/:id", businessClassController.deleteClass);

module.exports = router;
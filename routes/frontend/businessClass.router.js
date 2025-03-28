const express = require("express");
const router = express.Router();
const businessClassController = require("../../controllers/frontend/businessClass.controller");

router.post("/addClass", businessClassController.create);
router.get("/get", businessClassController.getClassById);
router.put("/update/:id", businessClassController.updateClass);
router.delete("/delete/:id", businessClassController.deleteClass);

module.exports = router;
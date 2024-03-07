const express = require("express");
const router = express.Router();
const familyController = require("../../controllers/frontend/family.controller");

router.post("/create", familyController.create);
router.get("/getbyuserid/:id", familyController.getAll);
router.get("/get/:id", familyController.getById);
router.post("/edit", familyController.editFamilyRelation);
router.post("/deleteById/:id", familyController.deleteById);
router.get("/getAllcustomer", familyController.getCustomerData);


module.exports = router;

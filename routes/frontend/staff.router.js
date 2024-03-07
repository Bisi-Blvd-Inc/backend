const express = require("express");
const router = express.Router();
const staffController = require("../../controllers/frontend/staff.controller");

router.post("/create", staffController.addStaff);
router.get("/get/:id", staffController.getAllStaff);
router.put("/edit/:userid/:id", staffController.editStaffDetail);
router.get("/getOne/:userid/:id", staffController.getStaffById);
router.delete("/removeById/:userId/:id", staffController.deleteStaff);
router.post("/updatePasswprd/:id", staffController.updateStaffPassword);
router.put("/password/:id", staffController.createStaffPassword);
router.get("/search/:userid", staffController.UserSearch);

module.exports = router;

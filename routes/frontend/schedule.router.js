const express = require("express");
const router = express.Router();
const calenderSettingController = require("../../controllers/frontend/schedule.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

router.post("/create", calenderSettingController.createSchedule);
router.get("/get", authMiddleware, calenderSettingController.getScheduleList);
// router.get("/getSchedule", authMiddleware, calenderSettingController.getBookingScheduleList);
router.get("/getSchedulethisweek", authMiddleware, calenderSettingController.getBookingScheduleListthisweek);
router.get("/getSchedulethismonth", authMiddleware, calenderSettingController.getBookingScheduleListthismonth);
router.delete("/remove/:id", authMiddleware, calenderSettingController.deleteSchedule);
router.post("/resendmail", calenderSettingController.resendmail);


module.exports = router;


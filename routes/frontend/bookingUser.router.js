const express = require("express");
const router = express.Router();
const bookingUserController = require("../../controllers/frontend/bookingUser.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");
var nodeCron = require("node-cron");
const upload = require("../../middlewares/multer");

router.post("/create", authMiddleware, bookingUserController.createUser);
router.get("/get", authMiddleware, bookingUserController.getBookingUsersList);
router.get(
  "/get/:id",
  authMiddleware,
  bookingUserController.getBookingUserById
);
router.get(
  "/get/:pageNo/:limit",
  authMiddleware,
  bookingUserController.getUser
);
router.put(
  "/edit/:id",
  upload.single("userProfileImg"),
  authMiddleware,
  bookingUserController.editBookingUser
);
router.delete(
  "/remove/:id",
  authMiddleware,
  bookingUserController.deleteUBookingUser
);

router.post("/multiRemove", bookingUserController.multiDeleteBookingUser);

router.get("/search", authMiddleware, bookingUserController.searchBookingUser);

module.exports = router;

const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/multer");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

const customerController = require("../../controllers/frontend/customer.controller");
router.post("/create", customerController.createCustomer);
router.post("/createbyuser", customerController.createclient);


router.get("/getuserServices/:id", customerController.getUserServices);
router.post("/getAll/", customerController.getAllCustomers);
router.get("/getbyid/:id", customerController.getbyCustomersid);

router.delete("/remove/:id", customerController.userDelete);
router.post("/decrypt", customerController.decryptId);
router.get("/search",authMiddleware, customerController.userSearch);
router.put(
  "/edit/:id",
  upload.single("userProfileImg"),
  customerController.editBookingUser
);
router.post("/resendmail", customerController.resendmail);

module.exports = router;

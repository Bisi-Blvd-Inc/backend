const express = require("express");
const router = express.Router();
const userController = require("../../controllers/frontend/user.controller");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");
router.post("/getCustomer", userController.getExternalCustomer);
router.post("/search", userController.externalBookingSearch);
router.get("/customerWithName", userController.getCustomerWithName);
router.post("/retrieveInvoice", userController.retrieveInvoice);
router.post("/create", authMiddleware, userController.createUser);
router.post("/restoreHistory", authMiddleware, userController.restoreHistory);
router.post("/Deletedhistory", authMiddleware, userController.deleteHistory);


router.post("/createBooking",  userController.createExternalBooking);
router.post("/createProducts", userController.createMultipleProducts)
router.post("/bookingPayment",  userController.ExternalBookingPayment);
router.post("/productPayment", userController.handleProductsPayment);
router.get("/get/:pageNo/:limit", authMiddleware, userController.getUser);
router.get("/stripe-signup-plans", userController.getStripeSignupPlans);
router.get("/stripe-plans-prices", userController.getStripePriceList);
router.post("/get", userController.getExternalServiceSetting);
router.post("/getSchedule",userController.getScheduleList);
router.get("/stripe-plans-final", userController.getStripeFinalList);
router.put("/edit/:id", authMiddleware, userController.UserEdit);
router.put("/editSignup/:id", userController.UserSignEdit);
router.put("/freePlan/:id", userController.UserFreeSignEdit);
router.delete("/remove/:id", authMiddleware, userController.userDelete);
router.get(
  "/search/:pageNo/:limit/:text",
  authMiddleware,
  userController.UserSearch
);
router.put("/loginStatus", authMiddleware, userController.loginStatusUpdate);
router.get("/getUserById/:id", authMiddleware, userController.getUserById);
router.get("/getUser/:id", authMiddleware, userController.getUserByIdforDashboard);
router.get("/getUserExternal/:id", userController.getUserForExternal);
router.get("/stripe-coupon-plans", userController.getCouponPlans);
router.get("/stripe-list-with-coupon", userController.getProductWithCoupon);
router.delete("/subscription-delete/:id", userController.deleteSubscription);
router.post("/webhook", userController.userWebhook);
router.get("/getAllUsersList", authMiddleware, userController.getAllUsersList);
router.get("/getPaymentHistory", authMiddleware, userController.getPaymentHistory);
router.post("/encrypt", authMiddleware, userController.encryptId);
router.put("/updateStatus", userController.UpdateStatus);
router.post("/customizeData", userController.customizeData);
router.post("/addCard", userController.addCard);
router.post("/getFilterPaymentHistory", authMiddleware, userController.getFilterPaymentHistory);
router.post("/getPaymentById", authMiddleware, userController.getPaymentById);
router.get("/countryCode", userController.getCountryCode);
router.get("/searchPayment",authMiddleware,userController.getSearchPaymentHistory)
router.post("/getAllInventory", userController.getAllInventory);
router.get("/getInventory/:id", userController.getSingleInventory);
router.post("/getBusinessClasses", userController.getBusinessClasses);


module.exports = router;
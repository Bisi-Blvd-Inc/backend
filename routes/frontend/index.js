const express = require("express");

const authRouter = require("./auth.router");
const personal_budgets = require("./personalBudget.router");
const company_budget = require("./companyBudget.router");
const businessRouter = require("./business.router");
const upgradeRouter = require("./upgrade.router");
const customerRouter = require("./customer.router");
const bookingRouter = require("./booking.router");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");
const userRouter = require("./user.router");
const bookingUser = require("./bookingUser.router");
const callenderSetting = require("./schedule.router");
const notificationRouter = require("./notification.router");
const inventoryRouter = require("./inventory.router");
const serviceSettingRouter = require("./serviceSetting.router")
const staffRouter = require("./staff.router");
const soapRouter = require("./soap.router");

const familyRouter = require("./family.router");
const productRouter = require("./product.router");
const notesRouter = require("./notes.router");
const userfilesRouter  =  require("./userfileupload.router");
const  giftCertificateList  = require("./giftCertificate.router");
const businessClassRouter = require("./businessClass.router");
const enterpriseRouter = require("./enterprise.router")

const router = express.Router();

router.use("/", authRouter);

router.use("/business", businessRouter);

router.use("/personal", authMiddleware, personal_budgets);
router.use("/company", authMiddleware, company_budget);
router.use("/upgrade", authMiddleware, upgradeRouter);
router.use("/user", userRouter);
router.use("/bookingUser", authMiddleware, bookingUser);
router.use("/calender", authMiddleware, callenderSetting);
router.use("/customer", customerRouter);
router.use("/booking", authMiddleware, bookingRouter);
router.use("/serviceSetting", authMiddleware, serviceSettingRouter);
router.use("/notification", notificationRouter);
router.use("/inventory", authMiddleware, inventoryRouter);
router.use("/staff", authMiddleware, staffRouter);
router.use("/staffs", staffRouter);

router.use("/soap",authMiddleware,  soapRouter);
router.use("/family", authMiddleware, familyRouter);
router.use("/product", authMiddleware, productRouter);
router.use("/notes", authMiddleware, notesRouter);
router.use("/filesUpload", authMiddleware, userfilesRouter );
router.use("/giftCertificate", authMiddleware, giftCertificateList );
router.use("/businessClass", authMiddleware, businessClassRouter);
router.use("/enterprise", enterpriseRouter);



module.exports = router;

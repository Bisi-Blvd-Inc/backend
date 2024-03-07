const express = require("express");
const router = express.Router();
const bookingController = require("../../controllers/frontend/booking.controller");
const upload = require("../../middlewares/multer");

router.post("/create", bookingController.createBooking);
router.post("/filter", bookingController.bookingFilter);
router.post(
  "/filterConfirmedBooking",
  bookingController.bookingFilterConfirmed
);

router.get("/list", bookingController.allBookingList);
router.get(
  "/listConfirmedBooking",
  bookingController.allConfirmedBooking
);

router.get("/get/:id", bookingController.singleBooking);
router.get("/search", bookingController.bookingSearch);
router.put("/update/:id", bookingController.editBooking);
router.get("/date/:start_date/:end_date", bookingController.getBookingwithDate);
router.post("/listWithName", bookingController.getBookingwithName);
router.get("/getUserServcie", bookingController.getUserService);
router.post("/getCustomer", bookingController.getCustomer);
router.post("/customerWithName", bookingController.getCustomerWithName);
router.delete("/delete/:id", bookingController.bookingDelete);
router.post("/multiRemove", bookingController.multiDeleteBooking);
router.put("/updateId/:id", bookingController.bookingEdit);
router.put("/cancel/:id", bookingController.bookingCancel);
router.get("/appointment/:id", bookingController.AppointmentbookingSearch);
router.get("/searchFiler", bookingController.searchAppointmentDateandName);
router.get("/invoice/:id", bookingController.Invoicesbooking);
router.get(
  "/searchFilerInvoices",
  bookingController.searchinvoiceStatusandName
);
router.post(
  "/generateLink",
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'linkImg', maxCount: 1 }
  ]),
  bookingController.customizeBookingLink
);


module.exports = router;

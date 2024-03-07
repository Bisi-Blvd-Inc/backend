const express = require("express");
const router = express.Router();

const businessServiceController = require("../../controllers/admin/businessService.controller");

router.post("/create", businessServiceController.createBusinessService);
router.get("/search", businessServiceController.searchServices);
router.get("/get/:pageNo/:limit", businessServiceController.getBusinessServiceWithPagination);
router.get("/byTypeId/:id", businessServiceController.getServiceByTypeId);
router.get("/getByUserId/:id", businessServiceController.getServicesByUserId);
router.put("/edit/:id", businessServiceController.editBusinessService);
router.delete("/remove/:id", businessServiceController.deleteBusinessService);

module.exports = router;

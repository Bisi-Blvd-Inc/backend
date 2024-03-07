const express = require("express");
const router = express.Router();
const businessController = require("../../controllers/admin/businessType.controller");

router.post("/create", businessController.createBusinessType);
router.get("/getAll", businessController.getAllBusinessTypes);
router.put("/edit/:id", businessController.editBusinessType);
router.get("/get/:pageNo/:limit", businessController.getAllWithPagination);
router.get("/get/:id", businessController.getById);
router.get("/search", businessController.Search);
router.put("/statusChange/:id/:status", businessController.usersStatus);


module.exports = router;

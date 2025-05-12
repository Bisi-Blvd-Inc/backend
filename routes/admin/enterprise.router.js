const express = require("express");
const router = express.Router();
const enterpriseController = require("../../controllers/admin/enterprise.controller");

router.post("/create", enterpriseController.createEnterprise);
router.get("/get/:pageNo/:limit", enterpriseController.getWithPagination);
router.get("/getById/:id", enterpriseController.getEnterpriseById);
router.put("/update/:id", enterpriseController.updateEnterprise);
router.delete("/delete/:id", enterpriseController.deleteEnterprise);


module.exports = router;

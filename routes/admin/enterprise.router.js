const express = require("express");
const router = express.Router();
const enterpriseController = require("../../controllers/admin/enterprise.controller");

router.post("/create", enterpriseController.createEnterprise);
router.get("/get/:pageNo/:limit", enterpriseController.getWithPagination);
router.get("/getById/:id", enterpriseController.getEnterpriseById);
router.put("/update/:id", enterpriseController.updateEnterprise);
router.delete("/delete/:id", enterpriseController.deleteEnterprise);
router.get("/addKey/:id", enterpriseController.addEnterpriseKey);
router.get("/deleteKey/:key", enterpriseController.deleteEnterpriseKey);
router.get("/exportKeys/:id", enterpriseController.exportEnterpriseKeysCsv);

module.exports = router;

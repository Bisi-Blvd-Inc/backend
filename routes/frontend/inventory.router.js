const express = require("express");
const router = express.Router();
const inventoryController = require("../../controllers/frontend/inventory.controller");
const upload = require("../../middlewares/multer")

router.post("/create",upload.array("productImgs", 3) ,inventoryController.createInventory);
router.get("/get", inventoryController.getAllInventory);
router.get("/get/:id", inventoryController.getSingleInventory);
router.put("/edit/:id",upload.array("productImgs", 3), inventoryController.editInventory);
router.delete("/removeById/:id", inventoryController.deleteInventory);
router.post("/multiRemove", inventoryController.multiDeleteInventory);
router.get("/search", inventoryController.searchInventory);

module.exports = router;

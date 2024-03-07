const express = require("express");
const router = express.Router();
const productController = require("../../controllers/frontend/product.controller");

router.post("/create", productController.createProduct);
router.get("/get/:id", productController.getAllProducts);
router.delete("/deleteById/:id", productController.deleteProductById);
router.get("/search", productController.searchProductByDateAndName);


module.exports = router;

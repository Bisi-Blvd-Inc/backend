const express = require("express");
const router = express.Router();
const soapController = require("../../controllers/frontend/soap.controller");
const upload = require("../../middlewares/multer")
const filesUpload =require("../../middlewares/uploadfiles")
router.post("/create/:id",filesUpload.array("files"),soapController.addSoap);
router.get("/getSoap/:id",soapController.getSoap);
router.post("/updateSoap",upload.array("files"),soapController.updateSoap);
router.get('/all',soapController.getAll)
router.get("/search/:subjective", soapController.searchSoaps);
router.delete("/deleteById/:id", soapController.deleteSoapById);


module.exports = router;

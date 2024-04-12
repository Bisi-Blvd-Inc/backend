const express = require("express");
const router = express.Router();
const soapController = require("../../controllers/frontend/soap.controller");
const upload = require("../../middlewares/multer")

router.post("/create/:id",upload.array("files"),soapController.addSoap);
router.get("/getSoap/:id",soapController.getSoap);
router.post("/updateSoap",upload.array("files"),soapController.updateSoap);
router.post('/addsoap',)
router.get('/all',soapController.getAll)
router.get("/search/:subjective/:date", soapController.searchSoaps);


module.exports = router;

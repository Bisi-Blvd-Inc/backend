const express = require("express");
const router = express.Router();
const giftCertificate= require("../../controllers/frontend/giftCertificate.controller");

router.get("/getList/:id",giftCertificate.getGiftCertificateList);
router.get("/searchGift", giftCertificate.searchgiftDateandName);




module.exports = router;

const express = require("express");
const router = express.Router();
const filesUpload= require("../../controllers/frontend/userDetailfileupload.controller");
const upload = require("../../middlewares/multer")

router.post("/add/:id",upload.single("files"),filesUpload.addfilesupdate);
router.post("/deleteIndex/:id",filesUpload.deletearrayindex);

router.get("/getFiles/:id",filesUpload.getFilesData);




module.exports = router;

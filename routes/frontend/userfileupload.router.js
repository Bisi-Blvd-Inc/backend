const express = require("express");
const router = express.Router();
const filesUpload= require("../../controllers/frontend/userDetailfileupload.controller");
const upload = require("../../middlewares/multer")

router.post("/add/:id",upload.single("file"),filesUpload.addfilesupdate);
router.delete("/deleteById/:id",filesUpload.deletearrayindex);

router.get("/getFiles/:id",filesUpload.getFilesData);
router.post("/update/:id",upload.single("file"),filesUpload.filesupdate )
router.post("/UpdateNoFile/:id",filesUpload.filesupdateNofile )


router.get("/search", filesUpload.searchProductByDateAndName);




module.exports = router;

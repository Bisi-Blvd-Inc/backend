const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const DIR = "./uploads/csv";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectoryExists(DIR, (err) => {
      if (err) {
        console.error("Error creating directory:", err);
      } else {
        cb(null, DIR);
        console.log(DIR, "in the dir");
      }
    });
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname?.toLowerCase().split(" ").join("-");
    cb(null, uuidv4() + "-" + fileName);
  },
});

function ensureDirectoryExists(directory, callback) {
  fs.access(directory, (error) => {
    if (error) {
      fs.mkdir(directory, { recursive: true }, (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    } else {
      callback(null);
    }
  });
}

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});


const usersController = require("../../controllers/admin/users.controller");
router.post("/import", upload.single("csvfile"), usersController.onImport);
router.get("/getRejects", usersController.getRejects);
router.post("/create", usersController.createUser);
router.get("/get/:pageNo/:limit", usersController.getUsersWithPagination);
router.delete("/removeById/:id", usersController.deleteUser);
router.put("/edit/:id", usersController.UsersEdit);
router.get("/search", usersController.UserSearch);
router.put("/statusChange/:id/:status", usersController.usersStatus);
router.get("/getAllUserOnly", usersController.getAllUsers);
router.get("/getbyid/:id", usersController.getbyid);

module.exports = router;

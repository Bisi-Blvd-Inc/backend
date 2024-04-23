const fs = require("fs");
const multer = require("multer");
const { resolve } = require("path");

const upload = `${resolve()}/uploads`;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(upload)) fs.mkdirSync(upload);
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    // Use the original filename
    cb(null, file.originalname);
  },
});

module.exports = multer({ storage });
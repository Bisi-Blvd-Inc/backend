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
    const { mimetype } = file;
    if (mimetype === "image/jpeg")
      return cb(null, file.fieldname + "-" + Date.now() + ".jpeg");

    if (mimetype === "image/png")
      return cb(null, file.fieldname + "-" + Date.now() + ".png");

    cb(null, file.fieldname + "-" + Date.now());
  },
});

module.exports = multer({ storage });

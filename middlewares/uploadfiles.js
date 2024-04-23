const fs = require("fs");
const multer = require("multer");
const { resolve } = require("path");

const uploadDir = `${resolve()}/uploads`;

// Multer configuration for file uploads
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const { originalname } = file;
    const fileExtension = originalname.split(".").pop();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${fileExtension}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept Excel, text, and PDF files
  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const uploadFiles = multer({
  storage: fileStorage,
  fileFilter,
});

module.exports = uploadFiles;
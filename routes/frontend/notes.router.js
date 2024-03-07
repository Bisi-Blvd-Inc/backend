const express = require("express");
const router = express.Router();
const notesController = require("../../controllers/frontend/notes.controller");

router.post("/create", notesController.create);
router.get("/get/:id", notesController.getAll);

module.exports = router;

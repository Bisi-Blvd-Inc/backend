const express = require("express");
const router = express.Router();
const personalController = require("../../controllers/frontend/personalBudget.controller");

router.post("/personal_budget", personalController.personal_budget);
router.post("/saveBudget", personalController.savePersonalBudget);
router.get("/getBudget", personalController.getPersonalBudget);
router.get("/Budget/:id", personalController.getPersonal);


router.put("/editPersonalBudget/:id", personalController.editPersonalBudget);
//
module.exports = router;

const express = require("express");
const router = express.Router();
const companyController = require("../../controllers/frontend/companyBudget.controller");
router.post(
  "/comapny_budget",
  companyController.comapny_budget
);
router.get("/getBussiness", companyController.getBusinessByUser);
router.post(
  "/saveBudget",
  companyController.saveGoalsBudget
);
router.put(
  "/editcomapanyGoals_Budget/:id",
  companyController.editCompanyBudget
);
router.get("/getcompanyGoalBudget", companyController.getGoalBudget);
router.get("/getBudgetById/:id", companyController.getGoalById);

module.exports = router;

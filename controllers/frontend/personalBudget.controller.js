const PersonalBudgetModal = require("../../models/personalBudget");
const personalService = require("../../services/prsonalBudget.service");
const { pick } = require("lodash");

const _ = require("lodash");

const personal_budget = async (req, res) => {
  try {
    const {
      income,
      housing,
      transportation,
      houseHold,
      loanPayments,
      personalInsurance,
      discretionary,
      companyExpenses,
      summaryObject,
    } = req.body;
    let addedBy = req._user;
    const prsonal_budget = {
      income,
      housing,
      transportation,
      houseHold,
      loanPayments,
      personalInsurance,
      discretionary,
      companyExpenses,
      summaryObject,
      addedBy,
    };
    const created_Prsonal_budget = await personalService.post(prsonal_budget);
    return res.status(201).json({
      success: true,
      message: "prsonal_budget added succesfully",
      data: created_Prsonal_budget,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const editPersonalBudget = async (req, res) => {
  try {
    let personalId = req.params.id;
    if (!personalId)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "personalId is required ",
      });
    let data = pick(req.body, [
      "income",
      "housing",
      "transportation",
      "houseHold",
      "loanPayments",
      "personalInsurance",
      "discretionary",
      "companyExpenses",
      "addedBy",
    ]);
    if (data.isDeleted) {
      message = "Goal Deleted Successfully";
    }

    let resultResponse = await personalService.update(
      {
        _id: personalId,
      },
      { $set: data },
      { fields: { _id: 1 }, new: true }
    );

    const result = await personalService.get(personalId);
    if (!result)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "Only admin can delete or modify project",
      });
    return res.status(200).json({
      status: 200,
      success: true,
      updateItem: result,
      message: "Goal updated successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const savePersonalBudget = async (req, res) => {
  try {
    const {
      income,
      housing,
      transportation,
      houseHold,
      loanPayments,
      personalInsurance,
      discretionary,
      companyExpenses,
      summaryObject,
    } = req.body;
    let addedBy = req._user;
    const prsonal_budget = {
      income,
      housing,
      transportation,
      houseHold,
      loanPayments,
      personalInsurance,
      discretionary,
      companyExpenses,
      summaryObject,

      addedBy,
    };
    const found = await PersonalBudgetModal.findOne({ addedBy });
    if (found) {
      await PersonalBudgetModal.findOneAndUpdate({ addedBy }, prsonal_budget);
    } else {
      await PersonalBudgetModal.create(prsonal_budget);
    }
    return res.status(200).json({
      success: true,
      message: "Personal Budget Saved succesfully",
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false,
    });
  }
};

const getPersonalBudget = async (req, res) => {
  try {
    let addedBy = req._user;
    const personalBudget = await PersonalBudgetModal.findOne({
      addedBy: addedBy,
    });
    return res.status(200).json({
      success: true,
      personalBudget,
      message: "Personal Budget success",
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false,
    });
  }
};
const getPersonal =  async (req, res) => {
  try {
    let addedBy = req._user;
    const personalBudget = await PersonalBudgetModal.findOne({
      addedBy: addedBy,
    });
    return res.status(200).json({
      success: true,
      personalBudget,
      message: "Personal Budget success",
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false,
    });
  }
};
//
module.exports = {
  personal_budget,
  editPersonalBudget,
  savePersonalBudget,
  getPersonalBudget,
  getPersonal
};

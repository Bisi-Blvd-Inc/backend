const companyService = require("../../services/companyBudget.service");
const userCollection = require("../../models/user");
const company_budgets = require("../../models/goalsCompanyBudget");
const companyBudgetService = require("../../services/companyBudget.service");
const mongoose = require("mongoose");
const { pick } = require("lodash");
const businessSchema = require("../../models/businessService");
const _ = require("lodash");

const comapny_budget = async (req, res) => {
  try {
    const { companyBudget, service, calculatedgoals, accurateGoals } = req.body;
    const comapny_budget = {
      companyBudget: companyBudget,
      service: service.service,
      calculatedgoals: calculatedgoals,
      accurateGoals: accurateGoals,
    };
    const created_Comapny_budget = await companyService.post(comapny_budget);
    return res.status(201).json({
      success: true,
      message: "ComapnyGoal_budget added succesfully",
      data: comapny_budget,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const saveGoalsBudget = async (req, res) => {
  try {
    const { companyBudget, service, calculatedgoals, accurateGoals } = req.body;
    let addedBy = req._user;

    const Goals_budget = {
      companyBudget,
      service,
      calculatedgoals,
      accurateGoals,
      addedBy,
    };
    const found = await company_budgets.findOne({ addedBy });
    if (found) {
      await company_budgets.findOneAndUpdate({ addedBy }, Goals_budget);
    } else {
      await company_budgets.create(Goals_budget);
    }
    return res.status(200).json({
      success: true,
      message: "Calculated successfully",
      data: Goals_budget,
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false,
    });
  }
};

const getBusinessByUser = async (req, res) => {
  try {
    const user = await userCollection.findOne({
      _id: req._user,
      isDeleted: false,
    });
    const btype =
      user &&
      user.businessType &&
      user.businessType.map((val) => {
        return mongoose.Types.ObjectId(val);
      });
    if (user && user.businessType) {
      let arr = [];

      const result = await businessSchema.aggregate([
        {
          $match: {
            businessTypeId: { $in: btype },
          },
        },
      ]);

      const service = result?.filter((val) => {
        if (val.role == 1) {
          return arr.push(val);
        }
      });

      let result1 = result?.filter((item) => {
        if (item.addedBy == req._user) {
          return arr.push(item);
        }
      });

      const serviceData = {
        businessType: result.businessType,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        isDeleted: result.isDeleted,
        id: result.id,
        service: arr,
      };

      if (!result) {
        return res.status(400).json({
          message: "Data not found",
          status: 404,
          data: [],
        });
      } else {
        return res.status(200).json({
          message: "Data get successfully",
          data: serviceData,
        });
      }
    }

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const editCompanyBudget = async (req, res) => {
  try {
    let goalsId = req.params.id;

    if (!goalsId)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "courseUnitId is required ",
      });
    let data = pick(req.body, ["companyBudget", "service", "calculation"]);

    let resultResponse = await companyBudgetService.update(
      {
        _id: goalsId,
      },
      { $set: data },
      { fields: { _id: 1 }, new: true }
    );

    const result = await companyBudgetService.get(goalsId);
    if (!result)
      return res.status(200).json({
        status: 401,
        success: false,
        message: "Something went wrong",
      });
    return res.status(200).json({
      status: 200,
      success: true,
      updateItem: result,
      message: "Goal_budget updated successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const getGoalBudget = async (req, res) => {
  try {
    let addedBy = req._user;
    const Goals_Budget = await company_budgets.findOne({ addedBy });
    return res.status(200).json({
      success: true,
      Goals_Budget,
      message: "Goals_Budget  success",
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false,
    });
  }
};

const getGoalById = async (req, res) => {
  try {
    let id = req.params.id;
    const Goals_Budget = await company_budgets.find({ addedBy: id });
    const serviceArray = await businessSchema.find();


    return res.status(200).json({
      success: true,
      data: Goals_Budget,
      message: " get Goals_Budget  success",
    });
  } catch (error) {
    return res.status(200).json({
      message: error.message,
      success: false,
    });
  }
};


module.exports = {
  comapny_budget,
  editCompanyBudget,
  getBusinessByUser,
  getGoalBudget,
  saveGoalsBudget,
  getGoalById,
};

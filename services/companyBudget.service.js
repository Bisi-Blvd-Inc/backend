const company_budgets = require("../models/goalsCompanyBudget");

const post = (payload) => company_budgets.create(payload);
const update = (condition, payload) => {
  return company_budgets.findByIdAndUpdate(condition, payload);
};
const get = (condition) => {
  return company_budgets.findById(condition);
};
module.exports = {
  post,
  update,
  get,
};

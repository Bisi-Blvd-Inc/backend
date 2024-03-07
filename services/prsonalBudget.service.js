const personal_budgets = require("../models/personalBudget");

const post = (payload) => personal_budgets.create(payload);
const update = (condition, payload) => {
  return personal_budgets.findByIdAndUpdate(condition, payload);
};
const get = (condition) => {
  return personal_budgets.findById(condition);
};

const importGet = () => {
  return personal_budgets.find();
};
module.exports = {
  post,
  update,
  get,
  importGet,
};

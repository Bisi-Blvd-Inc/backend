const upgradeCollection = require("../models/upgrade");

const post = (payload) => upgradeCollection.create(payload);
const findOne = (condition) => upgradeCollection.findOne(condition);

const remove = (condition) => upgradeCollection.findByIdAndDelete(condition);

module.exports = {
  post,
  remove,
  findOne,
};

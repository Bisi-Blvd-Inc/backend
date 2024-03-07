const familyCollection = require("../models/family");

const post = (payload) => familyCollection.create(payload);

const getAll = (condition) => {
  return familyCollection.find(condition);
};

const deleteById = (condition) => {
  return familyCollection.findByIdAndDelete(condition);
};
const update = (condition, payload) => {
  return familyCollection.findByIdAndUpdate(condition, payload);
};
const findById = (condition) => familyCollection.find(condition);

module.exports = {
  post,
  getAll,
  update,
  deleteById,
  findById,
};

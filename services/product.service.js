const productCollection = require("../models/product");

const post = (payload) => productCollection.create(payload);

const createMultiple = (payload) => productCollection.insertMany(payload);

const getAll = (condition) => {
  return productCollection.find(condition).populate("inventoryId");
};

const deleteById = (condition) => {
  return productCollection.findByIdAndDelete(condition);
};

module.exports = {
  post,
  getAll,
  deleteById,
  createMultiple,
};

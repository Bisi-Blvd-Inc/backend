const userCollection = require("../models/user");
const find = (condition) => userCollection.find(condition);
const findRole1 = (condition) => userCollection.findOne({ role: 1 });
const findOne = (condition) => userCollection.findOne(condition);
const findById = (condition) => userCollection.findById(condition);
const post = (payload) => userCollection.create(payload);
const get = (condition) => userCollection.find(condition);
const update = (condition, payload) =>
  userCollection.findByIdAndUpdate(condition, payload);
const updateone = (condition, payload) => {
  return userCollection.findByIdAndUpdate(condition, payload);
};
const updateLoginStatus = (condition, payload) => {
  return userCollection.findByIdAndUpdate(condition, payload);
};
module.exports = {
  findOne,
  post,
  get,
  update,
  find,
  findById,
  findRole1,
  updateone,
  updateLoginStatus,
};

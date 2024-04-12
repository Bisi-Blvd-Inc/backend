const usersoap = require("../models/userdetailsoap");

const post = (payload) => usersoap.create(payload);
const getSoapwithId =  (condition) => usersoap.findOne(condition)
const getAll=()=>usersoap.find()
const update = (condition, payload) => {
  return usersoap.findByIdAndUpdate(condition, payload);
};
const deleteById = (condition) => {
  return usersoap.findByIdAndDelete(condition);
};
module.exports = {
  post,
  getSoapwithId,
  update,
  getAll,
  deleteById
};

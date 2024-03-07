const usersoap = require("../models/userdetailsoap");

const post = (payload) => usersoap.create(payload);
const getSoapwithId =  (condition) => usersoap.findOne(condition)
const update = (condition, payload) => {
  return usersoap.findByIdAndUpdate(condition, payload);
};
module.exports = {
  post,
  getSoapwithId,
  update
};

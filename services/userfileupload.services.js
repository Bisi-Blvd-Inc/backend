const userfile = require("../models/userDetailfileupload");

const update = (condition, payload) => {
  return userfile.findOneAndUpdate(condition, payload);
};

const findOne = (condition) => userfile.findOne(condition);

const post = (payload) => userfile.create(payload);

const getFileswithId =  (condition) => userfile.find(condition)


module.exports = {

  update,
  findOne,
  getFileswithId,

  post,
};

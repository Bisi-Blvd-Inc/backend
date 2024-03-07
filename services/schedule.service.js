const calenderSchema = require("../models/schedule");

const get = (pageNo, limit) => {
  return calenderSchema
    .find({ role: 2, isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};
const update = (condition, payload) => {
  return calenderSchema.findByIdAndUpdate(condition, payload);
};


const deleteSchedule = (condition, payload) => {
  return calenderSchema.deleteOne(condition, payload);
};
const findSchedule = (condition) => calenderSchema.find(condition);
const findOne = (condition) => calenderSchema.findById(condition);
const find = (condition)=> calenderSchema.findOne(condition)
const remove = (condition) => calenderSchema.findByIdAndDelete(condition);
const post = (payload) => calenderSchema.create(payload);
const getAllSchedule = () => {
  return calenderSchema.find({ role: 2, isDeleted: false });
};

module.exports = {
  get,
  remove,
  update,
  findOne,
  find,
  deleteSchedule,
  findSchedule,
  post,
  getAllSchedule,
};

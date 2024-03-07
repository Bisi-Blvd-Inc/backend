const notificationCollection = require("../models/notification");

const post = (payload) => notificationCollection.create(payload);
const update = (condition, payload) => {
  return notificationCollection.findByIdAndUpdate(condition, payload);
};
const get = (condition) => {
  return notificationCollection.findById(condition);
};
const findOne = (condition) => {
  return notificationCollection.findOne(condition);
};
const find = (condition) => {
  return notificationCollection
    .find({
      bookedBy: condition,
      role: 1,
    })
    .populate("customerId");
};

const findAdmin = () => {
  return notificationCollection.find({ role: 2 });
};

module.exports = {
  post,
  update,
  get,
  findOne,
  findAdmin,
  find,
};

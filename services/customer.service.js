const customerCollection = require("../models/customer");

const post = (payload) => customerCollection.create(payload);
const update = (condition, payload) => {
  return customerCollection.findByIdAndUpdate(condition, payload);
};
const get = (condition) => {
  return customerCollection.findById(condition);
};
const findOne = (condition) => {
  return customerCollection.findOne(condition);
};

const getUserbyid = (condition) => {
  return customerCollection.findById(condition);
};

const find = (condition) => {
  return customerCollection.find(condition);
};
const getUserWithPagination = (userId, pageNo, limit) => {
  return customerCollection
    .find({ userId: userId })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};

const getUserBySearch = (text) => {
  return customerCollection.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [{ name: { $regex: String(text), $options: "i" } }],
          },
        ],
      },
    },
  ]);
};

const findALL = (condition) => {
  return customerCollection.find(condition);
};
module.exports = {
  post,
  update,
  get,
  findOne,
  getUserbyid,
  find,
  getUserWithPagination,
  getUserBySearch,
  findALL
};

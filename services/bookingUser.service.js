const bookingUserCollection = require("../models/bookingUser");

const get = (pageNo, limit) => {
  return bookingUserCollection
    .find({ role: 2, isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};
const update = (condition, payload) => {
  return bookingUserCollection.findByIdAndUpdate(condition, payload);
};


const deleteUser = (condition, payload) => {
  return bookingUserCollection.deleteOne(condition, payload);
};
const findUser = (condition) => bookingUserCollection.find(condition);
const findOne = (condition) => bookingUserCollection.findById(condition);
const getUsersBySearch = (text, pageNo, limit) => {
  return bookingUserCollection
    .find({
      $or: [
        { firstName: { $regex: String(text), $options: "i" } },
        { businessName: { $regex: String(text), $options: "i" } },
        { email: { $regex: String(text), $options: "i" } },
      ],
      isDeleted: false,
      role: 2,
    })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .populate("businessType");

};

const remove = (condition) => bookingUserCollection.findByIdAndDelete(condition);
const post = (payload) => bookingUserCollection.create(payload);
const getAllUser = () => {
  return bookingUserCollection.find({ role: 2, isDeleted: false });
};

module.exports = {
  get,
  remove,
  update,
  findOne,
  getUsersBySearch,
  deleteUser,
  findUser,
  post,
  getAllUser,
};

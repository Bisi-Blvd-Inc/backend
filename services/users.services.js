const userCollection = require("../models/user");

const get = (pageNo, limit) => {
  return userCollection
    .find({ role: 2 })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
};  
const update = (condition, payload) => {
  return userCollection.findByIdAndUpdate(condition, payload);
};
const updatestatus = (condition, payload) => {
  return userCollection.updateOne(condition, payload);
};
const findEmail = (condition) => userCollection.findOne(condition);
const findOne = (condition) => userCollection.findById(condition);
const getUsersBySearch = (text, pageNo, limit) => {
  return userCollection
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
    .sort({ createdAt: -1 })
    .populate("businessType");
};

const remove = (condition) => userCollection.findByIdAndDelete(condition);
const post = (payload) => userCollection.create(payload);
const getAllUser = () => {
  return userCollection.find({ role: 2, isDeleted: false })
  .sort({ createdAt: -1 });
};

module.exports = {
  get,
  remove,
  update,
  findOne,
  getUsersBySearch,
  updatestatus,
  findEmail,
  post,
  getAllUser,
};

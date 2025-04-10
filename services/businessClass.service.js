const businessClassCollection = require("../models/businessClass.js");

const post = (payload) => businessClassCollection.create(payload);
const getClass = (pageNo, limit) => {
  return businessClassCollection
    .find({ isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};
const getClassById = (id) => {
  return businessClassCollection.find({ isDeleted: false, addedBy: id });
};
const updateById = (condition, obj) => {
  return businessClassCollection.findByIdAndUpdate(condition, obj);
}
const getClassSearch = (pageNo, limit, text) => {
  return businessClassCollection
    .find({
      $or: [{ name: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit);
};
const deleteById = (id) => {
  return businessClassCollection.findByIdAndDelete(id);
};

module.exports = {
  getClass,
  post,
  getClassSearch,
  updateById,
  getClassById,
  deleteById,
}
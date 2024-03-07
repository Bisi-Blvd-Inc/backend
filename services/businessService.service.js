const businessServiceCollection = require("../models/businessService");

const post = (payload) => businessServiceCollection.create(payload);
const getService = (pageNo, limit) => {
  return businessServiceCollection
    .find({ isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};
const getServiceById = (id) => {
  return businessServiceCollection.find({ isDeleted: false, addedBy: id });
};
const getByTypeId = (id) => {
  return businessServiceCollection.find({
    businessTypeId: id,
    isDeleted: false,
  });
};

const updateById = (condition, obj) => {
  return businessServiceCollection.findByIdAndUpdate(condition, obj);
};

const getServiceSearch = (pageNo, limit, text) => {
  return businessServiceCollection
    .find({
      $or: [{ service: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit);
};

module.exports = {
  post,
  getService,
  getServiceSearch,
  updateById,
  getByTypeId,
  getServiceById,
};

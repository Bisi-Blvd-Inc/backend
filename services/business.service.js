const businessCollection = require("../models/business");
const businessServiceCollection = require("../models/businessService");

const post = (payload) => businessCollection.create(payload);
const findOne = (condition) => businessCollection.findOne(condition);
const countDocuments = (condition) => businessCollection.countDocuments(condition);
const getAll = () => businessCollection.find({isDeleted: false});
const getAllFrontend = () => businessCollection.find({isDeleted: false});
const find = (condition) => businessCollection.find(condition);
const getAllFrontendsignup = () => businessCollection.find({isDeleted: false});
const getAdminService = () =>
  businessServiceCollection.find({  role: 1 }).populate("businessTypeId");
const getUserService = (userId) =>
  businessServiceCollection.find({
   
    role: 2,
    addedBy: userId,
  });
const remove = (id) =>
  businessCollection.findByIdAndUpdate(id);
const update = (condition, payload, obj) =>
  businessCollection.findByIdAndUpdate(condition, payload, obj);
const getAllPagination = (pageNo, limit) => {
  return businessCollection
    .find()
    .sort({ createdAt: 1 })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};
const updatestatus = (condition, payload) => {
  return businessCollection.updateOne(condition, payload);
};

const search = (pageNo, limit, text) => {
  return businessCollection
    .find({
      $or: [{ businessType: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit);
};

const searchCount = (searchValue) => {
  return businessCollection
    .find({
      $or: [{ businessType: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    })
    .count();
};

const getById = (condition) => businessCollection.findById(condition);
const getAllService = (condition) => {
  return businessServiceCollection.find(
    {
      addedBy: condition,
    },
    { service: 1, _id: 1 }
  );
};
module.exports = {
  post,
  getAll,
  remove,
  update,
  findOne,
  find,
  getAllPagination,
  getById,
  getAdminService,
  getUserService,
  searchCount,
  countDocuments,
  search,
  getAllService,
  updatestatus,
  getAllFrontend,
  getAllFrontendsignup
};

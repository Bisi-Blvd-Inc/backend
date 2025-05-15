const EnterpriseCollection = require("../models/enterprise.js");
const { v4: uuidv4 } = require("uuid");

const createEnterprise = async (data) => {
  const enterpriseKey = uuidv4();
  const enterprise = new EnterpriseCollection({ ...data, enterpriseKey });
  return await enterprise.save();
};

const updateById = async (id, obj) => {
  return await EnterpriseCollection.findByIdAndUpdate(id, obj);
};

const deleteById = async (id) => {
  return await EnterpriseCollection.findByIdAndDelete(id);
};

const getEnterpriseByUserId = async (userId) => {
  return await EnterpriseCollection.findOne({ users: userId }).select(
    "-users -licenses"
  );
};

const getEnterpriseByKey = async (key) => {
  return await EnterpriseCollection.findOne({ enterpriseKey: key }).select(
    "-users -licenses"
  );
};

const addUserToEnterprise = async (enterpriseKey, userId) => {
  return await EnterpriseCollection.findOneAndUpdate(
    { enterpriseKey },
    { $addToSet: { users: userId } },
    { new: true }
  );
};

const get = async (pageNo, limit) => {
  return await EnterpriseCollection.find()
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate("businessType users");
};

const getEnterpriseById = async (id) => {
  return await EnterpriseCollection.findById(id).populate("businessType users");
};

module.exports = {
  createEnterprise,
  getEnterpriseByUserId,
  addUserToEnterprise,
  get,
  getEnterpriseById,
  updateById,
  deleteById,
  getEnterpriseByKey,
};
